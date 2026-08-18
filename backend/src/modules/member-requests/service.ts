import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "../../db/client";
import { designations, memberRequests, users } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { BadRequestError, NotFoundError } from "../../shared/errors";
import { assertSameOrg } from "../../middleware/org-scope";
import { getActorName, notify } from "../notifications/notify";
import type { AuthUserContext } from "../../shared/types";
import type { CreateMemberRequestInput, ListMemberRequestsQuery, RespondMemberRequestInput } from "./schemas";

export class MemberRequestService {
  constructor(private readonly db: Database) {}

  async create(authUser: AuthUserContext, input: CreateMemberRequestInput) {
    let designationName: string | null = null;
    if (input.designationId) {
      const designation = await this.db.query.designations.findFirst({ where: eq(designations.id, input.designationId) });
      if (!designation) throw new NotFoundError("Designation not found");
      designationName = designation.name;
    }

    const [request] = await this.db
      .insert(memberRequests)
      .values({
        organizationId: authUser.organizationId,
        managerId: authUser.userId,
        designationId: input.designationId ?? null,
        note: input.note,
      })
      .returning();
    if (!request) throw new Error("Failed to create request");

    const admins = await this.db.query.users.findMany({
      where: and(eq(users.organizationId, authUser.organizationId), eq(users.role, "ADMIN"), isNull(users.deletedAt)),
      columns: { id: true },
    });
    const actorName = await getActorName(this.db, authUser.userId);
    for (const admin of admins) {
      await notify(this.db, {
        organizationId: authUser.organizationId,
        recipientId: admin.id,
        actorId: authUser.userId,
        type: "MEMBER_REQUEST_CREATED",
        title: "New member request",
        body: designationName
          ? `${actorName} requested a new ${designationName}`
          : `${actorName} requested a new team member`,
        entityType: "member_request",
        entityId: request.id,
      });
    }

    return request;
  }

  /** ADMIN: every request in the org. MANAGER: only their own. */
  async list(authUser: AuthUserContext, query: ListMemberRequestsQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const conditions = [eq(memberRequests.organizationId, authUser.organizationId), isNull(memberRequests.deletedAt)];
    if (authUser.role === "MANAGER") conditions.push(eq(memberRequests.managerId, authUser.userId));
    if (query.status) conditions.push(eq(memberRequests.status, query.status));
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.memberRequests.findMany({ where, limit: pageSize, offset, orderBy: desc(memberRequests.createdAt) }),
      this.db.select({ value: count() }).from(memberRequests).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  async respond(authUser: AuthUserContext, id: string, input: RespondMemberRequestInput) {
    const request = await this.db.query.memberRequests.findFirst({ where: eq(memberRequests.id, id) });
    if (!request || request.deletedAt) throw new NotFoundError("Request not found");
    assertSameOrg(request.organizationId, authUser.organizationId);
    if (request.status !== "PENDING") throw new BadRequestError("This request has already been responded to");

    const [updated] = await this.db
      .update(memberRequests)
      .set({
        status: input.status,
        respondedById: authUser.userId,
        respondedAt: new Date(),
        responseNote: input.responseNote ?? null,
        updatedAt: new Date(),
      })
      .where(eq(memberRequests.id, id))
      .returning();
    if (!updated) throw new NotFoundError("Request not found");

    const actorName = await getActorName(this.db, authUser.userId);
    await notify(this.db, {
      organizationId: authUser.organizationId,
      recipientId: request.managerId,
      actorId: authUser.userId,
      type: "MEMBER_REQUEST_RESPONDED",
      title: input.status === "APPROVED" ? "Request approved" : "Request declined",
      body: `${actorName} ${input.status === "APPROVED" ? "approved" : "declined"} your team member request`,
      entityType: "member_request",
      entityId: updated.id,
    });

    return updated;
  }
}
