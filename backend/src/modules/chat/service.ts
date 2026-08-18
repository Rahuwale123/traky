import { and, count, desc, eq, gt, inArray, isNull, ne } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Database } from "../../db/client";
import { conversationParticipants, conversations, messages, users } from "../../db/schema/index";
import { normalizePagination, toPaginated } from "../../utils/response";
import { BadRequestError, NotFoundError } from "../../shared/errors";
import type { AuthUserContext } from "../../shared/types";
import type { AddParticipantsInput, CreateConversationInput, ListMessagesQuery, SendMessageInput } from "./schemas";

export class ChatService {
  constructor(
    private readonly db: Database,
    private readonly app: FastifyInstance,
  ) {}

  /** Anyone in the org is a valid chat contact — the only boundary is org membership. */
  async listContacts(authUser: AuthUserContext) {
    return this.db.query.users.findMany({
      where: and(
        eq(users.organizationId, authUser.organizationId),
        isNull(users.deletedAt),
        ne(users.id, authUser.userId),
      ),
      columns: { id: true, fullName: true, role: true },
      orderBy: (u, { asc }) => [asc(u.fullName)],
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.db.query.conversationParticipants.findFirst({
      where: and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)),
    });
    if (!participant) throw new NotFoundError("Conversation not found");
    return participant;
  }

  async createConversation(authUser: AuthUserContext, input: CreateConversationInput) {
    if (input.type === "DIRECT") {
      if (input.participantId === authUser.userId) {
        throw new BadRequestError("Cannot start a conversation with yourself");
      }

      const other = await this.db.query.users.findFirst({ where: eq(users.id, input.participantId) });
      if (!other || other.deletedAt || other.organizationId !== authUser.organizationId) {
        throw new NotFoundError("User not found");
      }

      const existing = await this.findExistingDirectConversation(authUser.userId, input.participantId);
      if (existing) return existing;

      const [convo] = await this.db
        .insert(conversations)
        .values({ organizationId: authUser.organizationId, type: "DIRECT", createdById: authUser.userId })
        .returning();
      if (!convo) throw new Error("Failed to create conversation");

      await this.db.insert(conversationParticipants).values([
        { conversationId: convo.id, userId: authUser.userId },
        { conversationId: convo.id, userId: input.participantId },
      ]);

      return convo;
    }

    const uniqueIds = [...new Set(input.participantIds)].filter((id) => id !== authUser.userId);
    if (uniqueIds.length === 0) throw new BadRequestError("Add at least one other member");

    const members = await this.db.query.users.findMany({
      where: and(inArray(users.id, uniqueIds), eq(users.organizationId, authUser.organizationId), isNull(users.deletedAt)),
    });
    if (members.length !== uniqueIds.length) throw new NotFoundError("One or more members not found");

    const [convo] = await this.db
      .insert(conversations)
      .values({ organizationId: authUser.organizationId, type: "GROUP", name: input.name, createdById: authUser.userId })
      .returning();
    if (!convo) throw new Error("Failed to create conversation");

    await this.db.insert(conversationParticipants).values([
      { conversationId: convo.id, userId: authUser.userId },
      ...uniqueIds.map((userId) => ({ conversationId: convo.id, userId })),
    ]);

    return convo;
  }

  private async findExistingDirectConversation(userIdA: string, userIdB: string) {
    const mine = await this.db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, userIdA),
      columns: { conversationId: true },
    });
    if (mine.length === 0) return null;
    const myConversationIds = mine.map((p) => p.conversationId);

    const theirs = await this.db.query.conversationParticipants.findMany({
      where: and(eq(conversationParticipants.userId, userIdB), inArray(conversationParticipants.conversationId, myConversationIds)),
      columns: { conversationId: true },
    });

    for (const shared of theirs) {
      const convo = await this.db.query.conversations.findFirst({
        where: and(eq(conversations.id, shared.conversationId), eq(conversations.type, "DIRECT"), isNull(conversations.deletedAt)),
      });
      if (convo) return convo;
    }
    return null;
  }

  async listConversations(authUser: AuthUserContext) {
    const myParticipations = await this.db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, authUser.userId),
    });
    if (myParticipations.length === 0) return [];

    const conversationIds = myParticipations.map((p) => p.conversationId);
    const convos = await this.db.query.conversations.findMany({
      where: and(inArray(conversations.id, conversationIds), isNull(conversations.deletedAt)),
    });

    const results = await Promise.all(
      convos.map(async (convo) => {
        const participation = myParticipations.find((p) => p.conversationId === convo.id);

        const allParticipants = await this.db.query.conversationParticipants.findMany({
          where: eq(conversationParticipants.conversationId, convo.id),
        });
        const otherIds = allParticipants.filter((p) => p.userId !== authUser.userId).map((p) => p.userId);
        const otherUsers = otherIds.length
          ? await this.db.query.users.findMany({
              where: inArray(users.id, otherIds),
              columns: { id: true, fullName: true },
            })
          : [];

        const lastMessage = await this.db.query.messages.findFirst({
          where: and(eq(messages.conversationId, convo.id), isNull(messages.deletedAt)),
          orderBy: (m, { desc: byDesc }) => [byDesc(m.createdAt)],
        });

        const unreadConditions = [
          eq(messages.conversationId, convo.id),
          isNull(messages.deletedAt),
          ne(messages.senderId, authUser.userId),
        ];
        if (participation?.lastReadAt) unreadConditions.push(gt(messages.createdAt, participation.lastReadAt));
        const [{ value: unreadCount } = { value: 0 }] = await this.db
          .select({ value: count() })
          .from(messages)
          .where(and(...unreadConditions));

        return {
          id: convo.id,
          type: convo.type,
          name: convo.type === "GROUP" ? convo.name : (otherUsers[0]?.fullName ?? "Unknown"),
          participants: otherUsers,
          lastMessage: lastMessage
            ? { body: lastMessage.body, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId }
            : null,
          unreadCount,
          updatedAt: lastMessage?.createdAt ?? convo.createdAt,
        };
      }),
    );

    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getById(authUser: AuthUserContext, id: string) {
    await this.assertParticipant(id, authUser.userId);
    const convo = await this.db.query.conversations.findFirst({ where: eq(conversations.id, id) });
    if (!convo || convo.deletedAt) throw new NotFoundError("Conversation not found");

    const allParticipants = await this.db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.conversationId, id),
    });
    const participantUsers = await this.db.query.users.findMany({
      where: inArray(
        users.id,
        allParticipants.map((p) => p.userId),
      ),
      columns: { id: true, fullName: true, role: true },
    });

    return { ...convo, participants: participantUsers };
  }

  async listMessages(authUser: AuthUserContext, conversationId: string, query: ListMessagesQuery) {
    await this.assertParticipant(conversationId, authUser.userId);
    const { page, pageSize, offset } = normalizePagination(query.page, query.pageSize);

    const where = and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt));
    const [items, [{ value: total } = { value: 0 }]] = await Promise.all([
      this.db.query.messages.findMany({ where, limit: pageSize, offset, orderBy: desc(messages.createdAt) }),
      this.db.select({ value: count() }).from(messages).where(where),
    ]);

    // Reverse within the page so the client can render straight through, oldest first.
    return toPaginated(items.reverse(), page, pageSize, total);
  }

  async sendMessage(authUser: AuthUserContext, conversationId: string, input: SendMessageInput) {
    await this.assertParticipant(conversationId, authUser.userId);

    const [message] = await this.db
      .insert(messages)
      .values({
        organizationId: authUser.organizationId,
        conversationId,
        senderId: authUser.userId,
        body: input.body,
      })
      .returning();
    if (!message) throw new Error("Failed to send message");

    await this.db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));

    const allParticipants = await this.db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.conversationId, conversationId),
    });
    for (const p of allParticipants) {
      if (p.userId === authUser.userId) continue;
      this.app.pushToUser(p.userId, { type: "message:new", conversationId, message });
    }

    return message;
  }

  async markRead(authUser: AuthUserContext, conversationId: string) {
    await this.assertParticipant(conversationId, authUser.userId);
    await this.db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, authUser.userId)));
  }

  async unreadCount(authUser: AuthUserContext) {
    const list = await this.listConversations(authUser);
    return list.reduce((sum, c) => sum + c.unreadCount, 0);
  }

  async addParticipants(authUser: AuthUserContext, conversationId: string, input: AddParticipantsInput) {
    await this.assertParticipant(conversationId, authUser.userId);
    const convo = await this.db.query.conversations.findFirst({ where: eq(conversations.id, conversationId) });
    if (!convo || convo.deletedAt) throw new NotFoundError("Conversation not found");
    if (convo.type !== "GROUP") throw new BadRequestError("Cannot add participants to a direct conversation");

    const uniqueIds = [...new Set(input.participantIds)];
    const members = await this.db.query.users.findMany({
      where: and(inArray(users.id, uniqueIds), eq(users.organizationId, authUser.organizationId), isNull(users.deletedAt)),
    });
    if (members.length !== uniqueIds.length) throw new NotFoundError("One or more members not found");

    const existing = await this.db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.conversationId, conversationId),
    });
    const existingIds = new Set(existing.map((p) => p.userId));
    const toAdd = uniqueIds.filter((id) => !existingIds.has(id));
    if (toAdd.length === 0) return;

    await this.db.insert(conversationParticipants).values(toAdd.map((userId) => ({ conversationId, userId })));
  }

  async leaveConversation(authUser: AuthUserContext, conversationId: string) {
    const convo = await this.db.query.conversations.findFirst({ where: eq(conversations.id, conversationId) });
    if (!convo || convo.deletedAt) throw new NotFoundError("Conversation not found");
    if (convo.type !== "GROUP") throw new BadRequestError("Cannot leave a direct conversation");

    await this.db
      .delete(conversationParticipants)
      .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, authUser.userId)));
  }
}
