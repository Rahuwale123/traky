import { and, count, desc, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import type { Database } from "../../db/client";
import { attendanceLogs, breakLogs, organizations, users } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { BadRequestError, ConflictError } from "../../shared/errors";
import { endOfDateStringInTimeZone, endOfDayInTimeZone, startOfDateStringInTimeZone, startOfDayInTimeZone } from "../../utils/timezone";
import type { AuthUserContext } from "../../shared/types";
import type { ListAttendanceQuery, StartBreakInput } from "./schemas";

function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

export class AttendanceService {
  constructor(private readonly db: Database) {}

  /** Every "today"/date-filter boundary in this service is computed in the org's own timezone, not the server's. */
  private async getOrgTimezone(organizationId: string): Promise<string> {
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: { timezone: true },
    });
    return org?.timezone ?? "UTC";
  }

  async punchIn(authUser: AuthUserContext) {
    const open = await this.db.query.attendanceLogs.findFirst({
      where: and(eq(attendanceLogs.userId, authUser.userId), eq(attendanceLogs.status, "PUNCHED_IN"), isNull(attendanceLogs.deletedAt)),
    });
    if (open) throw new ConflictError("Already punched in — punch out first");

    const [log] = await this.db
      .insert(attendanceLogs)
      .values({
        organizationId: authUser.organizationId,
        userId: authUser.userId,
        status: "PUNCHED_IN",
        punchInAt: new Date(),
      })
      .returning();
    if (!log) throw new Error("Failed to punch in");
    return log;
  }

  async punchOut(authUser: AuthUserContext) {
    const open = await this.db.query.attendanceLogs.findFirst({
      where: and(eq(attendanceLogs.userId, authUser.userId), eq(attendanceLogs.status, "PUNCHED_IN"), isNull(attendanceLogs.deletedAt)),
      orderBy: (log, { desc: descOrder }) => [descOrder(log.punchInAt)],
    });
    if (!open) throw new BadRequestError("Not currently punched in");

    // Auto-close a dangling break rather than blocking punch-out on it.
    const openBreak = await this.db.query.breakLogs.findFirst({
      where: and(eq(breakLogs.userId, authUser.userId), isNull(breakLogs.endedAt), isNull(breakLogs.deletedAt)),
    });
    if (openBreak) {
      await this.db.update(breakLogs).set({ endedAt: new Date(), updatedAt: new Date() }).where(eq(breakLogs.id, openBreak.id));
    }

    const [updated] = await this.db
      .update(attendanceLogs)
      .set({ status: "PUNCHED_OUT", punchOutAt: new Date(), updatedAt: new Date() })
      .where(eq(attendanceLogs.id, open.id))
      .returning();
    if (!updated) throw new Error("Failed to punch out");
    return updated;
  }

  async startBreak(authUser: AuthUserContext, input: StartBreakInput) {
    const open = await this.db.query.attendanceLogs.findFirst({
      where: and(eq(attendanceLogs.userId, authUser.userId), eq(attendanceLogs.status, "PUNCHED_IN"), isNull(attendanceLogs.deletedAt)),
      orderBy: (log, { desc: descOrder }) => [descOrder(log.punchInAt)],
    });
    if (!open) throw new BadRequestError("You must be punched in to start a break");

    const existingBreak = await this.db.query.breakLogs.findFirst({
      where: and(eq(breakLogs.userId, authUser.userId), isNull(breakLogs.endedAt), isNull(breakLogs.deletedAt)),
    });
    if (existingBreak) throw new ConflictError("Already on a break — end it first");

    const [created] = await this.db
      .insert(breakLogs)
      .values({
        organizationId: authUser.organizationId,
        userId: authUser.userId,
        attendanceLogId: open.id,
        reason: input.reason ?? null,
        startedAt: new Date(),
      })
      .returning();
    if (!created) throw new Error("Failed to start break");
    return created;
  }

  async endBreak(authUser: AuthUserContext) {
    const openBreak = await this.db.query.breakLogs.findFirst({
      where: and(eq(breakLogs.userId, authUser.userId), isNull(breakLogs.endedAt), isNull(breakLogs.deletedAt)),
      orderBy: (log, { desc: descOrder }) => [descOrder(log.startedAt)],
    });
    if (!openBreak) throw new BadRequestError("Not currently on a break");

    const [updated] = await this.db
      .update(breakLogs)
      .set({ endedAt: new Date(), updatedAt: new Date() })
      .where(eq(breakLogs.id, openBreak.id))
      .returning();
    if (!updated) throw new Error("Failed to end break");
    return updated;
  }

  async today(authUser: AuthUserContext) {
    const now = new Date();
    const timezone = await this.getOrgTimezone(authUser.organizationId);
    const dayStart = startOfDayInTimeZone(now, timezone);
    const dayEnd = endOfDayInTimeZone(now, timezone);

    const logs = await this.db.query.attendanceLogs.findMany({
      where: and(
        eq(attendanceLogs.userId, authUser.userId),
        isNull(attendanceLogs.deletedAt),
        gte(attendanceLogs.punchInAt, dayStart),
        lt(attendanceLogs.punchInAt, dayEnd),
      ),
      orderBy: (log, { asc }) => [asc(log.punchInAt)],
    });

    const breaks = await this.db.query.breakLogs.findMany({
      where: and(
        eq(breakLogs.userId, authUser.userId),
        isNull(breakLogs.deletedAt),
        gte(breakLogs.startedAt, dayStart),
        lt(breakLogs.startedAt, dayEnd),
      ),
      orderBy: (log, { asc }) => [asc(log.startedAt)],
    });

    const currentLog = logs.find((l) => l.status === "PUNCHED_IN") ?? null;
    const currentBreak = breaks.find((b) => !b.endedAt) ?? null;

    const grossMinutesToday = logs.reduce((sum, l) => {
      const end = l.punchOutAt ?? now;
      return sum + minutesBetween(l.punchInAt, end);
    }, 0);
    const totalBreakMinutesToday = breaks.reduce((sum, b) => {
      const end = b.endedAt ?? now;
      return sum + minutesBetween(b.startedAt, end);
    }, 0);

    return {
      isPunchedIn: Boolean(currentLog),
      isOnBreak: Boolean(currentBreak),
      currentLog,
      currentBreak,
      totalMinutesToday: Math.max(0, grossMinutesToday - totalBreakMinutesToday),
      totalBreakMinutesToday,
      logs,
      breaks,
    };
  }

  async myHistory(authUser: AuthUserContext, query: ListAttendanceQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);
    const conditions = [eq(attendanceLogs.userId, authUser.userId), isNull(attendanceLogs.deletedAt)];
    if (query.date) {
      const timezone = await this.getOrgTimezone(authUser.organizationId);
      conditions.push(
        gte(attendanceLogs.punchInAt, startOfDateStringInTimeZone(query.date, timezone)),
        lt(attendanceLogs.punchInAt, endOfDateStringInTimeZone(query.date, timezone)),
      );
    }
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.attendanceLogs.findMany({ where, limit: pageSize, offset, orderBy: desc(attendanceLogs.punchInAt) }),
      this.db.select({ value: count() }).from(attendanceLogs).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  /** ADMIN: every org member. MANAGER: their own team + themselves. */
  private async scopedUserIds(authUser: AuthUserContext): Promise<string[] | null> {
    if (authUser.role === "ADMIN") return null; // null = no user filter, org-wide
    const team = await this.db.query.users.findMany({
      where: and(eq(users.organizationId, authUser.organizationId), isNull(users.deletedAt)),
      columns: { id: true, managerId: true },
    });
    return team.filter((u) => u.id === authUser.userId || u.managerId === authUser.userId).map((u) => u.id);
  }

  async list(authUser: AuthUserContext, query: ListAttendanceQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);
    const scopedIds = await this.scopedUserIds(authUser);

    const conditions = [eq(attendanceLogs.organizationId, authUser.organizationId), isNull(attendanceLogs.deletedAt)];
    if (scopedIds) conditions.push(inArray(attendanceLogs.userId, scopedIds));
    if (query.userId) conditions.push(eq(attendanceLogs.userId, query.userId));
    if (query.date || (query.startDate && query.endDate)) {
      const timezone = await this.getOrgTimezone(authUser.organizationId);
      if (query.date) {
        conditions.push(
          gte(attendanceLogs.punchInAt, startOfDateStringInTimeZone(query.date, timezone)),
          lt(attendanceLogs.punchInAt, endOfDateStringInTimeZone(query.date, timezone)),
        );
      } else if (query.startDate && query.endDate) {
        conditions.push(
          gte(attendanceLogs.punchInAt, startOfDateStringInTimeZone(query.startDate, timezone)),
          lt(attendanceLogs.punchInAt, endOfDateStringInTimeZone(query.endDate, timezone)),
        );
      }
    }
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.attendanceLogs.findMany({ where, limit: pageSize, offset, orderBy: desc(attendanceLogs.punchInAt) }),
      this.db.select({ value: count() }).from(attendanceLogs).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  /** Today's punch-in rate for the requester's scope: who has punched in at least once today. */
  async todaySummary(authUser: AuthUserContext) {
    const now = new Date();
    const timezone = await this.getOrgTimezone(authUser.organizationId);
    const dayStart = startOfDayInTimeZone(now, timezone);
    const dayEnd = endOfDayInTimeZone(now, timezone);
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
      return { totalPeople: 0, punchedInCount: 0, rate: 0, people: [] };
    }

    const logs = await this.db.query.attendanceLogs.findMany({
      where: and(
        eq(attendanceLogs.organizationId, authUser.organizationId),
        isNull(attendanceLogs.deletedAt),
        inArray(attendanceLogs.userId, scopedPeople.map((p) => p.id)),
        gte(attendanceLogs.punchInAt, dayStart),
        lt(attendanceLogs.punchInAt, dayEnd),
      ),
    });

    const openByUser = new Map<string, boolean>();
    const everPunchedToday = new Set<string>();
    for (const log of logs) {
      everPunchedToday.add(log.userId);
      if (log.status === "PUNCHED_IN") openByUser.set(log.userId, true);
    }

    const peopleStatus = scopedPeople.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      role: p.role,
      isPunchedIn: openByUser.get(p.id) ?? false,
      hasPunchedToday: everPunchedToday.has(p.id),
    }));

    const punchedInCount = peopleStatus.filter((p) => p.hasPunchedToday).length;

    return {
      totalPeople: scopedPeople.length,
      punchedInCount,
      rate: Math.round((punchedInCount / scopedPeople.length) * 100),
      people: peopleStatus,
    };
  }
}
