import { and, count, eq, inArray, isNull } from "drizzle-orm";
import type { Database } from "../../db/client";
import { projects, taskComments, tasks, users } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { assertSameOrg } from "../../middleware/org-scope";
import { assertOwnTeamResource } from "../../middleware/team-scope";
import { getActorName, notify } from "../notifications/notify";
import { recordActivity } from "../../shared/audit";
import type { AuthUserContext } from "../../shared/types";
import type {
  CreateCommentInput,
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./schemas";

const STATUS_LABEL: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

export class TaskService {
  constructor(private readonly db: Database) {}

  private async getOwnedProject(authUser: AuthUserContext, projectId: string) {
    const project = await this.db.query.projects.findFirst({ where: eq(projects.id, projectId) });
    if (!project || project.deletedAt) throw new NotFoundError("Project not found");
    assertSameOrg(project.organizationId, authUser.organizationId);
    assertOwnTeamResource(project.managerId, authUser.userId);
    return project;
  }

  private async assertValidAssignee(authUser: AuthUserContext, assigneeId: string) {
    const assignee = await this.db.query.users.findFirst({ where: eq(users.id, assigneeId) });
    if (!assignee || assignee.deletedAt) throw new NotFoundError("Assignee not found");
    assertSameOrg(assignee.organizationId, authUser.organizationId);
    if (assignee.role !== "EMPLOYEE" || assignee.managerId !== authUser.userId) {
      throw new BadRequestError("Assignee must be a member of your own team");
    }
  }

  async create(authUser: AuthUserContext, input: CreateTaskInput) {
    const project = await this.getOwnedProject(authUser, input.projectId);
    if (input.assigneeId) await this.assertValidAssignee(authUser, input.assigneeId);

    const [task] = await this.db
      .insert(tasks)
      .values({
        organizationId: authUser.organizationId,
        projectId: input.projectId,
        assigneeId: input.assigneeId ?? null,
        createdById: authUser.userId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "MEDIUM",
        dueDate: input.dueDate ?? null,
      })
      .returning();
    if (!task) throw new Error("Failed to create task");

    await recordActivity(this.db, {
      organizationId: authUser.organizationId,
      actorId: authUser.userId,
      type: "TASK_CREATED",
      entityType: "task",
      entityId: task.id,
      metadata: { title: task.title, projectId: task.projectId },
    });

    if (task.assigneeId) {
      const actorName = await getActorName(this.db, authUser.userId);
      await notify(this.db, {
        organizationId: authUser.organizationId,
        recipientId: task.assigneeId,
        actorId: authUser.userId,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        body: `${actorName} assigned you "${task.title}" in ${project.name}`,
        entityType: "task",
        entityId: task.id,
      });
    }

    return task;
  }

  /** ADMIN: org-wide. MANAGER: tasks under their own projects. EMPLOYEE: use myTasks() instead. */
  async list(authUser: AuthUserContext, query: ListTasksQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const conditions = [eq(tasks.organizationId, authUser.organizationId), isNull(tasks.deletedAt)];

    if (query.projectId) {
      if (authUser.role === "MANAGER") await this.getOwnedProject(authUser, query.projectId);
      conditions.push(eq(tasks.projectId, query.projectId));
    } else if (authUser.role === "MANAGER") {
      const ownProjects = await this.db.query.projects.findMany({
        where: and(eq(projects.managerId, authUser.userId), isNull(projects.deletedAt)),
        columns: { id: true },
      });
      const ids = ownProjects.map((p) => p.id);
      if (ids.length === 0) return toPaginated([], page, pageSize, 0);
      conditions.push(inArray(tasks.projectId, ids));
    }

    if (query.assigneeId) conditions.push(eq(tasks.assigneeId, query.assigneeId));
    if (query.status) conditions.push(eq(tasks.status, query.status));

    const where = and(...conditions);
    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.tasks.findMany({ where, limit: pageSize, offset, orderBy: (t, { desc }) => [desc(t.createdAt)] }),
      this.db.select({ value: count() }).from(tasks).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  async myTasks(authUser: AuthUserContext, query: ListTasksQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);
    const conditions = [
      eq(tasks.organizationId, authUser.organizationId),
      eq(tasks.assigneeId, authUser.userId),
      isNull(tasks.deletedAt),
    ];
    if (query.status) conditions.push(eq(tasks.status, query.status));
    if (query.projectId) conditions.push(eq(tasks.projectId, query.projectId));
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.tasks.findMany({ where, limit: pageSize, offset, orderBy: (t, { desc }) => [desc(t.createdAt)] }),
      this.db.select({ value: count() }).from(tasks).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  async getById(authUser: AuthUserContext, id: string) {
    const task = await this.db.query.tasks.findFirst({ where: eq(tasks.id, id) });
    if (!task || task.deletedAt) throw new NotFoundError("Task not found");
    assertSameOrg(task.organizationId, authUser.organizationId);

    if (authUser.role === "MANAGER") {
      await this.getOwnedProject(authUser, task.projectId);
    } else if (authUser.role === "EMPLOYEE" && task.assigneeId !== authUser.userId) {
      throw new ForbiddenError("You do not have access to this task");
    }

    return task;
  }

  async update(authUser: AuthUserContext, id: string, input: UpdateTaskInput) {
    const task = await this.getById(authUser, id);
    if (authUser.role !== "MANAGER") throw new ForbiddenError("Only the owning manager can update this task");

    if (input.assigneeId) await this.assertValidAssignee(authUser, input.assigneeId);

    const [updated] = await this.db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(tasks.id, task.id))
      .returning();
    if (!updated) throw new NotFoundError("Task not found");

    const actorName = await getActorName(this.db, authUser.userId);

    if (input.assigneeId && input.assigneeId !== task.assigneeId) {
      await notify(this.db, {
        organizationId: authUser.organizationId,
        recipientId: input.assigneeId,
        actorId: authUser.userId,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        body: `${actorName} assigned you "${updated.title}"`,
        entityType: "task",
        entityId: updated.id,
      });
      await recordActivity(this.db, {
        organizationId: authUser.organizationId,
        actorId: authUser.userId,
        type: "TASK_ASSIGNED",
        entityType: "task",
        entityId: updated.id,
        metadata: { title: updated.title, assigneeId: input.assigneeId },
      });
    } else if (input.status && input.status !== task.status && updated.assigneeId) {
      await notify(this.db, {
        organizationId: authUser.organizationId,
        recipientId: updated.assigneeId,
        actorId: authUser.userId,
        type: "TASK_STATUS_CHANGED",
        title: "Task updated",
        body: `${actorName} moved "${updated.title}" to ${STATUS_LABEL[updated.status]}`,
        entityType: "task",
        entityId: updated.id,
      });
      await recordActivity(this.db, {
        organizationId: authUser.organizationId,
        actorId: authUser.userId,
        type: "TASK_STATUS_CHANGED",
        entityType: "task",
        entityId: updated.id,
        metadata: { title: updated.title, from: task.status, to: updated.status },
      });
    }

    return updated;
  }

  async updateStatus(authUser: AuthUserContext, id: string, input: UpdateTaskStatusInput) {
    const task = await this.getById(authUser, id);
    if (authUser.role === "EMPLOYEE" && task.assigneeId !== authUser.userId) {
      throw new ForbiddenError("You can only update tasks assigned to you");
    }

    const [updated] = await this.db
      .update(tasks)
      .set({ status: input.status, updatedAt: new Date() })
      .where(eq(tasks.id, task.id))
      .returning();
    if (!updated) throw new NotFoundError("Task not found");

    if (input.status !== task.status) {
      await recordActivity(this.db, {
        organizationId: authUser.organizationId,
        actorId: authUser.userId,
        type: "TASK_STATUS_CHANGED",
        entityType: "task",
        entityId: updated.id,
        metadata: { title: updated.title, from: task.status, to: updated.status },
      });

      const project = await this.db.query.projects.findFirst({ where: eq(projects.id, updated.projectId) });
      if (project) {
        const actorName = await getActorName(this.db, authUser.userId);
        await notify(this.db, {
          organizationId: authUser.organizationId,
          recipientId: project.managerId,
          actorId: authUser.userId,
          type: "TASK_STATUS_CHANGED",
          title: "Task updated",
          body: `${actorName} moved "${updated.title}" to ${STATUS_LABEL[updated.status]}`,
          entityType: "task",
          entityId: updated.id,
        });
      }
    }

    return updated;
  }

  async remove(authUser: AuthUserContext, id: string) {
    const task = await this.getById(authUser, id);
    if (authUser.role !== "MANAGER") throw new ForbiddenError("Only the owning manager can delete this task");

    await this.db.update(tasks).set({ deletedAt: new Date() }).where(eq(tasks.id, task.id));
    await recordActivity(this.db, {
      organizationId: authUser.organizationId,
      actorId: authUser.userId,
      type: "TASK_DELETED",
      entityType: "task",
      entityId: task.id,
      metadata: { title: task.title },
    });
  }

  async listComments(authUser: AuthUserContext, taskId: string) {
    await this.getById(authUser, taskId);
    return this.db.query.taskComments.findMany({
      where: and(eq(taskComments.taskId, taskId), isNull(taskComments.deletedAt)),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
    });
  }

  async addComment(authUser: AuthUserContext, taskId: string, input: CreateCommentInput) {
    const task = await this.getById(authUser, taskId);
    const [comment] = await this.db
      .insert(taskComments)
      .values({
        organizationId: authUser.organizationId,
        taskId: task.id,
        authorId: authUser.userId,
        body: input.body,
      })
      .returning();
    if (!comment) throw new Error("Failed to add comment");

    const actorName = await getActorName(this.db, authUser.userId);
    let recipientId: string | null = null;

    if (authUser.role === "EMPLOYEE") {
      const project = await this.db.query.projects.findFirst({ where: eq(projects.id, task.projectId) });
      recipientId = project?.managerId ?? null;
    } else if (task.assigneeId) {
      recipientId = task.assigneeId;
    }

    if (recipientId) {
      await notify(this.db, {
        organizationId: authUser.organizationId,
        recipientId,
        actorId: authUser.userId,
        type: "TASK_COMMENT",
        title: "New comment",
        body: `${actorName} commented on "${task.title}"`,
        entityType: "task",
        entityId: task.id,
      });
    }

    return comment;
  }
}
