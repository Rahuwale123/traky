import { pgTable, uuid, text, timestamp, pgEnum, boolean, index, AnyPgColumn } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { designations } from "./designations";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "MANAGER", "EMPLOYEE"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),

    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    role: userRoleEnum("role").notNull(),
    // Job title, picked from the seeded designations catalog — never free text.
    designationId: uuid("designation_id").references(() => designations.id),

    // Self-reference: an EMPLOYEE's manager. Null for ADMIN/MANAGER (managers report to admin implicitly).
    managerId: uuid("manager_id").references((): AnyPgColumn => users.id),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("users_org_idx").on(table.organizationId),
    index("users_org_email_idx").on(table.organizationId, table.email),
    index("users_manager_idx").on(table.managerId),
    index("users_designation_idx").on(table.designationId),
    index("users_org_role_idx").on(table.organizationId, table.role),
  ],
);
