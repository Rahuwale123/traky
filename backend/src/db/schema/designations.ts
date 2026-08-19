import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// Catalog of job titles (e.g. "Sr Python Developer", "ML Engineer") — always
// picked from this list, never free text, so titles can't fragment into
// near-duplicates. organizationId NULL = a platform-wide default visible to
// every org (read-only for admins); non-null = a title an org's own admin
// added, editable/archivable only by that org.
export const designations = pgTable(
  "designations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    name: text("name").notNull(),
    category: text("category").notNull(),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("designations_name_idx").on(table.name), index("designations_org_idx").on(table.organizationId)],
);
