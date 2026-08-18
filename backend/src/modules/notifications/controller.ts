import type { FastifyReply, FastifyRequest } from "fastify";
import { NotificationService } from "./service";
import { ok } from "../../utils/response";
import type { ListNotificationsQuery } from "./schemas";

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser, request.query as ListNotificationsQuery);
    return reply.send(ok(result));
  };

  unreadCount = async (request: FastifyRequest, reply: FastifyReply) => {
    const count = await this.service.unreadCount(request.authUser);
    return reply.send(ok({ count }));
  };

  markRead = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const updated = await this.service.markRead(request.authUser, id);
    return reply.send(ok(updated));
  };

  markAllRead = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.markAllRead(request.authUser);
    return reply.send(ok({ marked: true }));
  };
}
