import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

// Master catalog of job titles (e.g. "Sr Python Developer", "ML Engineer").
// Platform-seeded only — there is no create/update API, by design: an admin
// or manager picks from this list when adding a member, they never type a
// free-text title that could fragment into near-duplicates.
export const designations = pgTable(
  "designations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    category: text("category").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("designations_name_idx").on(table.name)],
);
