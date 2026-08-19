import { and, count, eq, isNull } from "drizzle-orm";
import type { Database } from "../../db/client";
import { designations, users } from "../../db/schema/index";
import { hashPassword } from "../../utils/password";
import { normalizePagination, toPaginated } from "../../utils/response";
import { ConflictError, NotFoundError, BadRequestError } from "../../shared/errors";
import { assertSameOrg } from "../../middleware/org-scope";
import { getActorName, notify } from "../notifications/notify";
import { recordActivity } from "../../shared/audit";
import type { AssignManagerInput, CreateEmployeeInput, CreateManagerInput, ListUsersQuery, UpdateUserInput } from "./schemas";

export class UserService {
  constructor(private readonly db: Database) {}

  private async ensureEmailAvailable(email: string) {
    const existing = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) throw new ConflictError("Email already in use");
  }

  /** designationId must reference the seeded catalog — never accept an arbitrary/free-text value. */
  private async assertDesignationExists(designationId: string) {
    const designation = await this.db.query.designations.findFirst({ where: eq(designations.id, designationId) });
    if (!designation) throw new NotFoundError("Designation not found");
  }

  async createManager(organizationId: string, actorId: string, input: CreateManagerInput) {
    await this.ensureEmailAvailable(input.email);
    if (input.designationId) await this.assertDesignationExists(input.designationId);

    const passwordHash = await hashPassword(input.password);
    const [manager] = await this.db
      .insert(users)
      .values({
        organizationId,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: "MANAGER",
        designationId: input.designationId ?? null,
      })
      .returning();
    if (!manager) throw new Error("Failed to create manager");

    await recordActivity(this.db, {
      organizationId,
      actorId,
      type: "USER_CREATED",
      entityType: "user",
      entityId: manager.id,
      metadata: { role: "MANAGER", fullName: manager.fullName, email: manager.email },
    });

    return manager;
  }

  async createEmployee(organizationId: string, actorId: string, input: CreateEmployeeInput) {
    await this.ensureEmailAvailable(input.email);
    if (input.designationId) await this.assertDesignationExists(input.designationId);

    if (input.managerId) {
      const manager = await this.db.query.users.findFirst({ where: eq(users.id, input.managerId) });
      if (!manager || manager.deletedAt) throw new NotFoundError("Manager not found");
      assertSameOrg(manager.organizationId, organizationId);
      if (manager.role !== "MANAGER") throw new BadRequestError("managerId must reference a MANAGER");
    }

    const passwordHash = await hashPassword(input.password);
    const [employee] = await this.db
      .insert(users)
      .values({
        organizationId,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: "EMPLOYEE",
        managerId: input.managerId ?? null,
        designationId: input.designationId ?? null,
      })
      .returning();
    if (!employee) throw new Error("Failed to create employee");

    await recordActivity(this.db, {
      organizationId,
      actorId,
      type: "USER_CREATED",
      entityType: "user",
      entityId: employee.id,
      metadata: { role: "EMPLOYEE", fullName: employee.fullName, email: employee.email },
    });

    if (employee.managerId) {
      const actorName = await getActorName(this.db, actorId);
      await notify(this.db, {
        organizationId,
        recipientId: employee.managerId,
        actorId,
        type: "MEMBER_ASSIGNED",
        title: "New team member",
        body: `${actorName} added ${employee.fullName} to your team`,
        entityType: "user",
        entityId: employee.id,
      });
    }

    return employee;
  }

  async list(organizationId: string, query: ListUsersQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const conditions = [eq(users.organizationId, organizationId), isNull(users.deletedAt)];
    if (query.role) conditions.push(eq(users.role, query.role));
    if (query.managerId) conditions.push(eq(users.managerId, query.managerId));
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.users.findMany({ where, limit: pageSize, offset, orderBy: (u, { desc }) => [desc(u.createdAt)] }),
      this.db.select({ value: count() }).from(users).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  async myTeam(organizationId: string, managerId: string, query: ListUsersQuery) {
    return this.list(organizationId, { ...query, role: "EMPLOYEE", managerId });
  }

  async getById(organizationId: string, id: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user || user.deletedAt) throw new NotFoundError("User not found");
    assertSameOrg(user.organizationId, organizationId);
    return user;
  }

  async update(organizationId: string, actorId: string, id: string, input: UpdateUserInput) {
    const existing = await this.getById(organizationId, id);
    if (input.designationId) await this.assertDesignationExists(input.designationId);

    const [updated] = await this.db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new NotFoundError("User not found");

    if (input.isActive !== undefined && input.isActive !== existing.isActive) {
      await recordActivity(this.db, {
        organizationId,
        actorId,
        type: input.isActive ? "USER_REACTIVATED" : "USER_DEACTIVATED",
        entityType: "user",
        entityId: id,
        metadata: { fullName: updated.fullName },
      });
    }
    if (input.designationId !== undefined && input.designationId !== existing.designationId) {
      await recordActivity(this.db, {
        organizationId,
        actorId,
        type: "USER_DESIGNATION_CHANGED",
        entityType: "user",
        entityId: id,
        metadata: { fullName: updated.fullName, from: existing.designationId, to: input.designationId },
      });
    }

    return updated;
  }

  async assignManager(organizationId: string, actorId: string, employeeId: string, input: AssignManagerInput) {
    const employee = await this.getById(organizationId, employeeId);
    if (employee.role !== "EMPLOYEE") throw new BadRequestError("Only employees can be assigned to a manager");

    const manager = await this.getById(organizationId, input.managerId);
    if (manager.role !== "MANAGER") throw new BadRequestError("managerId must reference a MANAGER");

    const [updated] = await this.db
      .update(users)
      .set({ managerId: manager.id, updatedAt: new Date() })
      .where(eq(users.id, employeeId))
      .returning();
    if (!updated) throw new NotFoundError("User not found");

    const actorName = await getActorName(this.db, actorId);
    await notify(this.db, {
      organizationId,
      recipientId: manager.id,
      actorId,
      type: "MEMBER_ASSIGNED",
      title: "New team member",
      body: `${actorName} assigned ${updated.fullName} to your team`,
      entityType: "user",
      entityId: updated.id,
    });
    await recordActivity(this.db, {
      organizationId,
      actorId,
      type: "USER_MANAGER_ASSIGNED",
      entityType: "user",
      entityId: updated.id,
      metadata: { fullName: updated.fullName, managerId: manager.id, managerName: manager.fullName },
    });

    return updated;
  }
}
