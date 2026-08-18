import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const projectStatusEnum = pgEnum("project_status", ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    managerId: uuid("manager_id")
      .notNull()
      .references(() => users.id),

    name: text("name").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("ACTIVE"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("projects_org_idx").on(table.organizationId),
    index("projects_org_manager_idx").on(table.organizationId, table.managerId),
  ],
);
