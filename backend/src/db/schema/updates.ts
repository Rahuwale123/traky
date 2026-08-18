// Phase 2+: activity/notification feed. Table exists now so migrations stay
// forward-compatible; no routes/services touch it yet.
import { pgTable, uuid, text, date, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const dailyUpdates = pgTable(
  "daily_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    date: date("date").notNull(),
    summary: text("summary").notNull(),
    blockers: text("blockers"),
    planForTomorrow: text("plan_for_tomorrow"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("daily_updates_org_idx").on(table.organizationId),
    // One update per person per day — enforced at the DB level, not just app logic.
    uniqueIndex("daily_updates_user_date_unique").on(table.userId, table.date),
  ],
);

// Generic audit/notification trail — task assigned, status changed, member added, etc.
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    actorId: uuid("actor_id").references(() => users.id),

    type: text("type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("activities_org_idx").on(table.organizationId),
    index("activities_org_entity_idx").on(table.organizationId, table.entityType, table.entityId),
  ],
);
