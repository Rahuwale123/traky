import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";
import { designations } from "./designations";

export const memberRequestStatusEnum = pgEnum("member_request_status", ["PENDING", "APPROVED", "REJECTED"]);

// A manager asking the admin to hire/assign a new team member — an approval
// workflow, not an auto-creation shortcut. The admin still creates the actual
// employee from the Team page after approving.
export const memberRequests = pgTable(
  "member_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    managerId: uuid("manager_id")
      .notNull()
      .references(() => users.id),
    designationId: uuid("designation_id").references(() => designations.id),

    note: text("note").notNull(),
    status: memberRequestStatusEnum("status").notNull().default("PENDING"),

    respondedById: uuid("responded_by_id").references(() => users.id),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    responseNote: text("response_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("member_requests_org_idx").on(table.organizationId),
    index("member_requests_org_manager_idx").on(table.organizationId, table.managerId),
    index("member_requests_org_status_idx").on(table.organizationId, table.status),
  ],
);
