import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "../../db/client";
import { activities, users } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import type { ListActivitiesQuery } from "./schemas";

export class ActivityService {
  constructor(private readonly db: Database) {}

  async list(organizationId: string, query: ListActivitiesQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const conditions = [eq(activities.organizationId, organizationId)];
    if (query.entityType) conditions.push(eq(activities.entityType, query.entityType));
    if (query.type) conditions.push(eq(activities.type, query.type));
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.activities.findMany({ where, limit: pageSize, offset, orderBy: desc(activities.createdAt) }),
      this.db.select({ value: count() }).from(activities).where(where),
    ]);

    const actorIds = [...new Set(items.map((a) => a.actorId).filter((id): id is string => id !== null))];
    const actors = actorIds.length
      ? await this.db.query.users.findMany({ where: inArray(users.id, actorIds), columns: { id: true, fullName: true } })
      : [];
    const actorNameById = new Map(actors.map((a) => [a.id, a.fullName]));

    const enriched = items.map((a) => ({
      ...a,
      actorName: a.actorId ? (actorNameById.get(a.actorId) ?? "Unknown") : "System",
    }));

    return toPaginated(enriched, page, pageSize, total);
  }
}
