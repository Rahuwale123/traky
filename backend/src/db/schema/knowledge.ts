import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";
import { projects } from "./projects";

export const resourceScopeEnum = pgEnum("resource_scope", ["GLOBAL", "TEAM", "PROJECT"]);
export const resourceStatusEnum = pgEnum("resource_status", ["PENDING", "APPROVED", "REJECTED"]);

// Shared links (docs, YouTube videos, etc.) — never file uploads, deliberately
// kept link-only for now. ADMIN/MANAGER shares publish immediately; an
// EMPLOYEE's share is PENDING until their own manager (or an admin) approves it.
export const knowledgeResources = pgTable(
  "knowledge_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),

    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),

    scope: resourceScopeEnum("scope").notNull(),
    // Set only when scope = TEAM — identifies whose team this belongs to.
    teamManagerId: uuid("team_manager_id").references(() => users.id),
    // Set only when scope = PROJECT.
    projectId: uuid("project_id").references(() => projects.id),

    status: resourceStatusEnum("status").notNull().default("PENDING"),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id),
    approvedById: uuid("approved_by_id").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectionNote: text("rejection_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("knowledge_resources_org_idx").on(table.organizationId),
    index("knowledge_resources_org_status_idx").on(table.organizationId, table.status),
    index("knowledge_resources_team_manager_idx").on(table.teamManagerId),
    index("knowledge_resources_project_idx").on(table.projectId),
    index("knowledge_resources_created_by_idx").on(table.createdById),
  ],
);
