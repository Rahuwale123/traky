import type { FastifyReply, FastifyRequest } from "fastify";
import { ChatService } from "./service";
import { ok } from "../../utils/response";
import type { AddParticipantsInput, CreateConversationInput, ListMessagesQuery, SendMessageInput } from "./schemas";

export class ChatController {
  constructor(private readonly service: ChatService) {}

  listContacts = async (request: FastifyRequest, reply: FastifyReply) => {
    const contacts = await this.service.listContacts(request.authUser);
    return reply.send(ok(contacts));
  };

  createConversation = async (request: FastifyRequest, reply: FastifyReply) => {
    const convo = await this.service.createConversation(request.authUser, request.body as CreateConversationInput);
    return reply.code(201).send(ok(convo));
  };

  listConversations = async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await this.service.listConversations(request.authUser);
    return reply.send(ok(list));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const convo = await this.service.getById(request.authUser, id);
    return reply.send(ok(convo));
  };

  listMessages = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const result = await this.service.listMessages(request.authUser, id, request.query as ListMessagesQuery);
    return reply.send(ok(result));
  };

  sendMessage = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const message = await this.service.sendMessage(request.authUser, id, request.body as SendMessageInput);
    return reply.code(201).send(ok(message));
  };

  markRead = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.service.markRead(request.authUser, id);
    return reply.send(ok({ read: true }));
  };

  unreadCount = async (request: FastifyRequest, reply: FastifyReply) => {
    const count = await this.service.unreadCount(request.authUser);
    return reply.send(ok({ count }));
  };

  addParticipants = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.service.addParticipants(request.authUser, id, request.body as AddParticipantsInput);
    return reply.send(ok({ added: true }));
  };

  leave = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.service.leaveConversation(request.authUser, id);
    return reply.send(ok({ left: true }));
  };
}
