import { and, count, desc, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import type { Database } from "../../db/client";
import { dailyUpdates, organizations, users } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { dateStringInTimeZone, nextDateString } from "../../utils/timezone";
import type { AuthUserContext } from "../../shared/types";
import type { ListDailyUpdatesQuery, UpsertTodayUpdateInput } from "./schemas";

export class DailyUpdateService {
  constructor(private readonly db: Database) {}

  /** "Today" is computed in the org's own timezone, not the server's. */
  private async getOrgTimezone(organizationId: string): Promise<string> {
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: { timezone: true },
    });
    return org?.timezone ?? "UTC";
  }

  async upsertToday(authUser: AuthUserContext, input: UpsertTodayUpdateInput) {
    const timezone = await this.getOrgTimezone(authUser.organizationId);
    const today = dateStringInTimeZone(timezone);
    const existing = await this.db.query.dailyUpdates.findFirst({
      where: and(eq(dailyUpdates.userId, authUser.userId), eq(dailyUpdates.date, today), isNull(dailyUpdates.deletedAt)),
    });

    if (existing) {
      const [updated] = await this.db
        .update(dailyUpdates)
        .set({
          summary: input.summary,
          blockers: input.blockers ?? null,
          planForTomorrow: input.planForTomorrow ?? null,
          updatedAt: new Date(),
        })
        .where(eq(dailyUpdates.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update today's update");
      return updated;
    }

    const [created] = await this.db
      .insert(dailyUpdates)
      .values({
        organizationId: authUser.organizationId,
        userId: authUser.userId,
        date: today,
        summary: input.summary,
        blockers: input.blockers ?? null,
        planForTomorrow: input.planForTomorrow ?? null,
      })
      .returning();
    if (!created) throw new Error("Failed to submit today's update");
    return created;
  }

  async today(authUser: AuthUserContext) {
    const timezone = await this.getOrgTimezone(authUser.organizationId);
    const today = dateStringInTimeZone(timezone);
    const update = await this.db.query.dailyUpdates.findFirst({
      where: and(eq(dailyUpdates.userId, authUser.userId), eq(dailyUpdates.date, today), isNull(dailyUpdates.deletedAt)),
    });
    return update ?? null;
  }

  async myHistory(authUser: AuthUserContext, query: ListDailyUpdatesQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);
    const conditions = [eq(dailyUpdates.userId, authUser.userId), isNull(dailyUpdates.deletedAt)];
    if (query.startDate && query.endDate) {
      conditions.push(gte(dailyUpdates.date, query.startDate), lt(dailyUpdates.date, nextDateString(query.endDate)));
    }
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.dailyUpdates.findMany({ where, limit: pageSize, offset, orderBy: desc(dailyUpdates.date) }),
      this.db.select({ value: count() }).from(dailyUpdates).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  /** ADMIN: every org member. MANAGER: their own team + themselves. */
  private async scopedUserIds(authUser: AuthUserContext): Promise<string[] | null> {
    if (authUser.role === "ADMIN") return null;
    const team = await this.db.query.users.findMany({
      where: and(eq(users.organizationId, authUser.organizationId), isNull(users.deletedAt)),
      columns: { id: true, managerId: true },
    });
    return team.filter((u) => u.id === authUser.userId || u.managerId === authUser.userId).map((u) => u.id);
  }

  async list(authUser: AuthUserContext, query: ListDailyUpdatesQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);
    const scopedIds = await this.scopedUserIds(authUser);

    const conditions = [eq(dailyUpdates.organizationId, authUser.organizationId), isNull(dailyUpdates.deletedAt)];
    if (scopedIds) conditions.push(inArray(dailyUpdates.userId, scopedIds));
    if (query.userId) conditions.push(eq(dailyUpdates.userId, query.userId));
    if (query.startDate && query.endDate) {
      conditions.push(gte(dailyUpdates.date, query.startDate), lt(dailyUpdates.date, nextDateString(query.endDate)));
    }
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.dailyUpdates.findMany({ where, limit: pageSize, offset, orderBy: desc(dailyUpdates.date) }),
      this.db.select({ value: count() }).from(dailyUpdates).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  /** Today's submission rate for the requester's scope. */
  async todaySummary(authUser: AuthUserContext) {
    const scopedIds = await this.scopedUserIds(authUser);

    const people = await this.db.query.users.findMany({
      where: and(
        eq(users.organizationId, authUser.organizationId),
        isNull(users.deletedAt),
        inArray(users.role, ["MANAGER", "EMPLOYEE"]),
      ),
      columns: { id: true, fullName: true, role: true, managerId: true },
    });
    const scopedPeople = scopedIds ? people.filter((p) => scopedIds.includes(p.id)) : people;

    if (scopedPeople.length === 0) {
      return { totalPeople: 0, submittedCount: 0, rate: 0, people: [] };
    }

    const timezone = await this.getOrgTimezone(authUser.organizationId);
    const today = dateStringInTimeZone(timezone);
    const updates = await this.db.query.dailyUpdates.findMany({
      where: and(
        eq(dailyUpdates.organizationId, authUser.organizationId),
        isNull(dailyUpdates.deletedAt),
        inArray(dailyUpdates.userId, scopedPeople.map((p) => p.id)),
        eq(dailyUpdates.date, today),
      ),
    });
    const submittedIds = new Set(updates.map((u) => u.userId));

    const peopleStatus = scopedPeople.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      role: p.role,
      hasSubmittedToday: submittedIds.has(p.id),
    }));

    const submittedCount = peopleStatus.filter((p) => p.hasSubmittedToday).length;

    return {
      totalPeople: scopedPeople.length,
      submittedCount,
      rate: Math.round((submittedCount / scopedPeople.length) * 100),
      people: peopleStatus,
    };
  }
}
