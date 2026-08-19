import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { knowledgeResources, projects, tasks, users } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { assertSameOrg } from "../../middleware/org-scope";
import { assertOwnTeamResource } from "../../middleware/team-scope";
import { recordActivity } from "../../shared/audit";
import { getActorName, notify } from "../notifications/notify";
import type { AuthUserContext } from "../../shared/types";
import type { CreateResourceInput, ListResourcesQuery, RejectResourceInput } from "./schemas";

type ResourceRow = typeof knowledgeResources.$inferSelect;

export class KnowledgeService {
  constructor(private readonly db: Database) {}

  private async getMyEmployeeIds(managerId: string): Promise<string[]> {
    const reports = await this.db.query.users.findMany({
      where: and(eq(users.managerId, managerId), isNull(users.deletedAt)),
      columns: { id: true },
    });
    return reports.map((u) => u.id);
  }

  /** Mirrors ProjectService's own visibility rules — a manager's own projects, or an employee's assigned ones. */
  private async getVisibleProjectIds(authUser: AuthUserContext): Promise<string[]> {
    if (authUser.role === "MANAGER") {
      const owned = await this.db.query.projects.findMany({
        where: and(eq(projects.organizationId, authUser.organizationId), eq(projects.managerId, authUser.userId), isNull(projects.deletedAt)),
        columns: { id: true },
      });
      return owned.map((p) => p.id);
    }
    if (authUser.role === "EMPLOYEE") {
      const assigned = await this.db.query.tasks.findMany({
        where: and(eq(tasks.organizationId, authUser.organizationId), eq(tasks.assigneeId, authUser.userId)),
        columns: { projectId: true },
      });
      return [...new Set(assigned.map((t) => t.projectId))];
    }
    return [];
  }

  private async enrich(items: ResourceRow[]) {
    const userIds = [
      ...new Set(items.flatMap((r) => [r.createdById, r.approvedById, r.teamManagerId]).filter((id): id is string => !!id)),
    ];
    const projectIds = [...new Set(items.map((r) => r.projectId).filter((id): id is string => !!id))];

    const [usersFound, projectsFound] = await Promise.all([
      userIds.length ? this.db.query.users.findMany({ where: inArray(users.id, userIds), columns: { id: true, fullName: true } }) : [],
      projectIds.length ? this.db.query.projects.findMany({ where: inArray(projects.id, projectIds), columns: { id: true, name: true } }) : [],
    ]);
    const userNameById = new Map(usersFound.map((u) => [u.id, u.fullName]));
    const projectNameById = new Map(projectsFound.map((p) => [p.id, p.name]));

    return items.map((r) => ({
      ...r,
      createdByName: userNameById.get(r.createdById) ?? "Unknown",
      approvedByName: r.approvedById ? (userNameById.get(r.approvedById) ?? "Unknown") : null,
      teamManagerName: r.teamManagerId ? (userNameById.get(r.teamManagerId) ?? "Unknown") : null,
      projectName: r.projectId ? (projectNameById.get(r.projectId) ?? "Unknown") : null,
    }));
  }

  async create(authUser: AuthUserContext, input: CreateResourceInput) {
    let teamManagerId: string | null = null;
    let projectId: string | null = null;

    if (input.scope === "TEAM") {
      if (authUser.role === "ADMIN") {
        if (!input.teamManagerId) throw new BadRequestError("teamManagerId is required for admin-created TEAM resources");
        const manager = await this.db.query.users.findFirst({ where: eq(users.id, input.teamManagerId) });
        if (!manager || manager.deletedAt || manager.organizationId !== authUser.organizationId || manager.role !== "MANAGER") {
          throw new NotFoundError("Manager not found");
        }
        teamManagerId = manager.id;
      } else if (authUser.role === "MANAGER") {
        teamManagerId = authUser.userId;
      } else {
        if (!authUser.managerId) throw new BadRequestError("You must have a manager assigned to share with your team");
        teamManagerId = authUser.managerId;
      }
    }

    if (input.scope === "PROJECT") {
      const project = await this.db.query.projects.findFirst({ where: eq(projects.id, input.projectId) });
      if (!project || project.deletedAt) throw new NotFoundError("Project not found");
      assertSameOrg(project.organizationId, authUser.organizationId);

      if (authUser.role === "MANAGER") {
        assertOwnTeamResource(project.managerId, authUser.userId);
      } else if (authUser.role === "EMPLOYEE") {
        const ownTask = await this.db.query.tasks.findFirst({
          where: and(eq(tasks.projectId, project.id), eq(tasks.assigneeId, authUser.userId)),
        });
        if (!ownTask) throw new ForbiddenError("You can only share resources for projects you're assigned to");
      }
      projectId = project.id;
    }

    const needsApproval = authUser.role === "EMPLOYEE";
    const now = new Date();

    const [created] = await this.db
      .insert(knowledgeResources)
      .values({
        organizationId: authUser.organizationId,
        title: input.title,
        url: input.url,
        description: input.description ?? null,
        scope: input.scope,
        teamManagerId,
        projectId,
        status: needsApproval ? "PENDING" : "APPROVED",
        createdById: authUser.userId,
        ...(needsApproval ? {} : { approvedById: authUser.userId, approvedAt: now }),
      })
      .returning();
    if (!created) throw new Error("Failed to create resource");

    await recordActivity(this.db, {
      organizationId: authUser.organizationId,
      actorId: authUser.userId,
      type: needsApproval ? "RESOURCE_SUBMITTED" : "RESOURCE_SHARED",
      entityType: "knowledge_resource",
      entityId: created.id,
      metadata: { title: created.title, scope: created.scope },
    });

    if (needsApproval && authUser.managerId) {
      const actorName = await getActorName(this.db, authUser.userId);
      await notify(this.db, {
        organizationId: authUser.organizationId,
        recipientId: authUser.managerId,
        actorId: authUser.userId,
        type: "RESOURCE_PENDING_APPROVAL",
        title: "Resource needs approval",
        body: `${actorName} shared "${created.title}" — needs your approval`,
        entityType: "knowledge_resource",
        entityId: created.id,
      });
    }

    const [enriched] = await this.enrich([created]);
    return enriched;
  }

  async list(authUser: AuthUserContext, query: ListResourcesQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const conditions = [eq(knowledgeResources.organizationId, authUser.organizationId), isNull(knowledgeResources.deletedAt)];

    if (authUser.role !== "ADMIN") {
      const visibleProjectIds = await this.getVisibleProjectIds(authUser);
      const ownTeamManagerId = authUser.role === "MANAGER" ? authUser.userId : authUser.managerId;
      const myEmployeeIds = authUser.role === "MANAGER" ? await this.getMyEmployeeIds(authUser.userId) : [];

      const approvedVisibility = or(
        eq(knowledgeResources.scope, "GLOBAL"),
        ownTeamManagerId
          ? and(eq(knowledgeResources.scope, "TEAM"), eq(knowledgeResources.teamManagerId, ownTeamManagerId))
          : sql`false`,
        visibleProjectIds.length > 0
          ? and(eq(knowledgeResources.scope, "PROJECT"), inArray(knowledgeResources.projectId, visibleProjectIds))
          : sql`false`,
      );

      const ownerIds = [authUser.userId, ...myEmployeeIds];
      const ownPendingOrRejected = and(
        inArray(knowledgeResources.status, ["PENDING", "REJECTED"]),
        inArray(knowledgeResources.createdById, ownerIds),
      );

      conditions.push(or(and(eq(knowledgeResources.status, "APPROVED"), approvedVisibility), ownPendingOrRejected)!);
    }

    if (query.status) conditions.push(eq(knowledgeResources.status, query.status));
    if (query.scope) conditions.push(eq(knowledgeResources.scope, query.scope));
    if (query.projectId) conditions.push(eq(knowledgeResources.projectId, query.projectId));
    if (query.search) {
      conditions.push(
        or(ilike(knowledgeResources.title, `%${query.search}%`), ilike(knowledgeResources.description, `%${query.search}%`))!,
      );
    }

    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.knowledgeResources.findMany({ where, limit: pageSize, offset, orderBy: desc(knowledgeResources.createdAt) }),
      this.db.select({ value: count() }).from(knowledgeResources).where(where),
    ]);

    return toPaginated(await this.enrich(items), page, pageSize, total);
  }

  private async assertVisible(authUser: AuthUserContext, resource: ResourceRow) {
    if (authUser.role === "ADMIN") return;

    if (resource.status === "APPROVED") {
      if (resource.scope === "GLOBAL") return;
      if (resource.scope === "TEAM") {
        const ownTeamManagerId = authUser.role === "MANAGER" ? authUser.userId : authUser.managerId;
        if (ownTeamManagerId && resource.teamManagerId === ownTeamManagerId) return;
      }
      if (resource.scope === "PROJECT" && resource.projectId) {
        const visibleProjectIds = await this.getVisibleProjectIds(authUser);
        if (visibleProjectIds.includes(resource.projectId)) return;
      }
      throw new NotFoundError("Resource not found");
    }

    // PENDING/REJECTED — only the creator, their manager (the approver), or an admin.
    if (resource.createdById === authUser.userId) return;
    if (authUser.role === "MANAGER") {
      const creator = await this.db.query.users.findFirst({ where: eq(users.id, resource.createdById) });
      if (creator?.managerId === authUser.userId) return;
    }
    throw new NotFoundError("Resource not found");
  }

  async getById(authUser: AuthUserContext, id: string) {
    const resource = await this.db.query.knowledgeResources.findFirst({ where: eq(knowledgeResources.id, id) });
    if (!resource || resource.deletedAt) throw new NotFoundError("Resource not found");
    assertSameOrg(resource.organizationId, authUser.organizationId);
    await this.assertVisible(authUser, resource);
    const [enriched] = await this.enrich([resource]);
    return enriched;
  }

  private async assertCanModerate(authUser: AuthUserContext, resource: ResourceRow) {
    if (authUser.role === "ADMIN") return;
    if (authUser.role === "MANAGER") {
      const creator = await this.db.query.users.findFirst({ where: eq(users.id, resource.createdById) });
      if (creator?.managerId === authUser.userId) return;
    }
    throw new ForbiddenError("You cannot moderate this resource");
  }

  async approve(authUser: AuthUserContext, id: string) {
    const resource = await this.db.query.knowledgeResources.findFirst({ where: eq(knowledgeResources.id, id) });
    if (!resource || resource.deletedAt) throw new NotFoundError("Resource not found");
    assertSameOrg(resource.organizationId, authUser.organizationId);
    if (resource.status !== "PENDING") throw new BadRequestError("This resource has already been reviewed");
    await this.assertCanModerate(authUser, resource);

    const [updated] = await this.db
      .update(knowledgeResources)
      .set({ status: "APPROVED", approvedById: authUser.userId, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(knowledgeResources.id, id))
      .returning();
    if (!updated) throw new Error("Failed to approve resource");

    const actorName = await getActorName(this.db, authUser.userId);
    await notify(this.db, {
      organizationId: authUser.organizationId,
      recipientId: resource.createdById,
      actorId: authUser.userId,
      type: "RESOURCE_APPROVED",
      title: "Resource approved",
      body: `${actorName} approved "${updated.title}" — it's now shared`,
      entityType: "knowledge_resource",
      entityId: updated.id,
    });
    await recordActivity(this.db, {
      organizationId: authUser.organizationId,
      actorId: authUser.userId,
      type: "RESOURCE_APPROVED",
      entityType: "knowledge_resource",
      entityId: updated.id,
      metadata: { title: updated.title },
    });

    const [enriched] = await this.enrich([updated]);
    return enriched;
  }

  async reject(authUser: AuthUserContext, id: string, input: RejectResourceInput) {
    const resource = await this.db.query.knowledgeResources.findFirst({ where: eq(knowledgeResources.id, id) });
    if (!resource || resource.deletedAt) throw new NotFoundError("Resource not found");
    assertSameOrg(resource.organizationId, authUser.organizationId);
    if (resource.status !== "PENDING") throw new BadRequestError("This resource has already been reviewed");
    await this.assertCanModerate(authUser, resource);

    const [updated] = await this.db
      .update(knowledgeResources)
      .set({
        status: "REJECTED",
        approvedById: authUser.userId,
        approvedAt: new Date(),
        rejectionNote: input.note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeResources.id, id))
      .returning();
    if (!updated) throw new Error("Failed to reject resource");

    const actorName = await getActorName(this.db, authUser.userId);
    await notify(this.db, {
      organizationId: authUser.organizationId,
      recipientId: resource.createdById,
      actorId: authUser.userId,
      type: "RESOURCE_REJECTED",
      title: "Resource declined",
      body: `${actorName} declined "${updated.title}"${input.note ? `: ${input.note}` : ""}`,
      entityType: "knowledge_resource",
      entityId: updated.id,
    });
    await recordActivity(this.db, {
      organizationId: authUser.organizationId,
      actorId: authUser.userId,
      type: "RESOURCE_REJECTED",
      entityType: "knowledge_resource",
      entityId: updated.id,
      metadata: { title: updated.title, note: input.note },
    });

    const [enriched] = await this.enrich([updated]);
    return enriched;
  }

  async remove(authUser: AuthUserContext, id: string) {
    const resource = await this.db.query.knowledgeResources.findFirst({ where: eq(knowledgeResources.id, id) });
    if (!resource || resource.deletedAt) throw new NotFoundError("Resource not found");
    assertSameOrg(resource.organizationId, authUser.organizationId);
    if (resource.createdById !== authUser.userId && authUser.role !== "ADMIN") {
      throw new ForbiddenError("You can only remove your own shared resources");
    }
    await this.db.update(knowledgeResources).set({ deletedAt: new Date() }).where(eq(knowledgeResources.id, id));
  }
}
