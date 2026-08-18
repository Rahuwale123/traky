import { pgTable, uuid, text, timestamp, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const conversationTypeEnum = pgEnum("conversation_type", ["DIRECT", "GROUP"]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    type: conversationTypeEnum("type").notNull(),
    name: text("name"), // GROUP only — a DIRECT conversation's display name is derived from the other participant
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("conversations_org_idx").on(table.organizationId)],
);

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversation_participants_conversation_idx").on(table.conversationId),
    index("conversation_participants_user_idx").on(table.userId),
    uniqueIndex("conversation_participants_unique").on(table.conversationId, table.userId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("messages_conversation_idx").on(table.conversationId, table.createdAt)],
);
