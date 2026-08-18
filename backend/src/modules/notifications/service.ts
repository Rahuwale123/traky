import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "../../db/client";
import { notifications } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { NotFoundError } from "../../shared/errors";
import type { AuthUserContext } from "../../shared/types";
import type { ListNotificationsQuery } from "./schemas";

export class NotificationService {
  constructor(private readonly db: Database) {}

  async list(authUser: AuthUserContext, query: ListNotificationsQuery) {
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const conditions = [eq(notifications.recipientId, authUser.userId)];
    if (query.unreadOnly) conditions.push(isNull(notifications.readAt));
    const where = and(...conditions);

    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.notifications.findMany({ where, limit: pageSize, offset, orderBy: desc(notifications.createdAt) }),
      this.db.select({ value: count() }).from(notifications).where(where),
    ]);

    return toPaginated(items, page, pageSize, total);
  }

  async unreadCount(authUser: AuthUserContext) {
    const [{ value } = { value: 0 }] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.recipientId, authUser.userId), isNull(notifications.readAt)));
    return value;
  }

  async markRead(authUser: AuthUserContext, id: string) {
    const existing = await this.db.query.notifications.findFirst({ where: eq(notifications.id, id) });
    if (!existing || existing.recipientId !== authUser.userId) throw new NotFoundError("Notification not found");

    const [updated] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllRead(authUser: AuthUserContext) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.recipientId, authUser.userId), isNull(notifications.readAt)));
  }
}
