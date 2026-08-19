import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    // IANA timezone (e.g. "America/New_York") — determines "today" boundaries
    // for attendance and daily updates. See src/utils/timezone.ts.
    timezone: text("timezone").notNull().default("UTC"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("organizations_slug_idx").on(table.slug)],
);
