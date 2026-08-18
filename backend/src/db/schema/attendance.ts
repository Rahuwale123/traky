import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "PUNCHED_IN",
  "PUNCHED_OUT",
]);

export const attendanceLogs = pgTable(
  "attendance_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    status: attendanceStatusEnum("status").notNull().default("PUNCHED_IN"),
    punchInAt: timestamp("punch_in_at", { withTimezone: true }).notNull(),
    punchOutAt: timestamp("punch_out_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("attendance_logs_org_idx").on(table.organizationId),
    index("attendance_logs_org_user_idx").on(table.organizationId, table.userId),
  ],
);

export const breakLogs = pgTable(
  "break_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    attendanceLogId: uuid("attendance_log_id").references(() => attendanceLogs.id),

    reason: text("reason"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("break_logs_org_idx").on(table.organizationId),
    index("break_logs_org_user_idx").on(table.organizationId, table.userId),
  ],
);
