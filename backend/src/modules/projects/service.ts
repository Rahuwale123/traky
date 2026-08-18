import { and, count, eq, inArray, isNull } from "drizzle-orm";
import type { Database } from "../../db/client";
import { projects, tasks } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { NotFoundError } from "../../shared/errors";
import { assertSameOrg } from "../../middleware/org-scope";
import { assertOwnTeamResource } from "../../middleware/team-scope";
import type { AuthUserContext } from "../../shared/types";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "./schemas";

export class ProjectService {
  constructor(private readonly db: Database) {}

  async create(authUser: AuthUserContext, input: CreateProjectInput) {
    const [project] = await this.db
      .insert(projects)
      .values({
        organizationId: authUser.organizationId,
        managerId: authUser.userId,
        name: input.name,
        description: input.description ?? null,
      })
      .returning();
    if (!project) throw new Error("Failed to create project");
    return project;
  }

  /**
   * ADMIN sees every project in the org; MANAGER sees only their own;
   * EMPLOYEE sees only projects that have at least one task assigned to them.
   */
  async list(authUser: AuthUserContext, query: ListProjectsQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const conditions = [eq(projects.organizationId, authUser.organizationId), isNull(projects.deletedAt)];
    if (authUser.role === "MANAGER") conditions.push(eq(projects.managerId, authUser.userId));
    if (authUser.role === "EMPLOYEE") {
      const assigned = await this.db.query.tasks.findMany({
        where: and(eq(tasks.organizationId, authUser.organizationId), eq(tasks.assigneeId, authUser.userId)),
        columns: { projectId: true },
      });
      const projectIds = [...new Set(assigned.map((t) => t.projectId))];
      if (projectIds.length === 0) return toPaginated([], page, pageSize, 0);
      conditions.push(inArray(projects.id, projectIds));
    }
    if (query.status) conditions.push(eq(projects.status, query.status));
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.projects.findMany({ where, limit: pageSize, offset, orderBy: (p, { desc }) => [desc(p.createdAt)] }),
      this.db.select({ value: count() }).from(projects).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  async getById(authUser: AuthUserContext, id: string) {
    const project = await this.db.query.projects.findFirst({ where: eq(projects.id, id) });
    if (!project || project.deletedAt) throw new NotFoundError("Project not found");
    assertSameOrg(project.organizationId, authUser.organizationId);
    if (authUser.role === "MANAGER") assertOwnTeamResource(project.managerId, authUser.userId);
    if (authUser.role === "EMPLOYEE") {
      const ownTask = await this.db.query.tasks.findFirst({
        where: and(eq(tasks.projectId, id), eq(tasks.assigneeId, authUser.userId)),
      });
      if (!ownTask) throw new NotFoundError("Project not found");
    }
    return project;
  }

  async update(authUser: AuthUserContext, id: string, input: UpdateProjectInput) {
    const project = await this.getById(authUser, id);
    assertOwnTeamResource(project.managerId, authUser.userId);

    const [updated] = await this.db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) throw new NotFoundError("Project not found");
    return updated;
  }

  async remove(authUser: AuthUserContext, id: string) {
    const project = await this.getById(authUser, id);
    assertOwnTeamResource(project.managerId, authUser.userId);

    await this.db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, id));
  }
}
