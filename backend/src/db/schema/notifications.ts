import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "TASK_ASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_COMMENT",
  "MEMBER_ASSIGNED",
]);

// Per-recipient notification inbox — distinct from `activities` (a future
// generic org-wide audit log). Every row here is addressed to exactly one person.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id),
    actorId: uuid("actor_id").references(() => users.id),

    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),

    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_org_idx").on(table.organizationId),
    index("notifications_recipient_idx").on(table.recipientId, table.createdAt),
  ],
);
