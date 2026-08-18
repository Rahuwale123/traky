import type { FastifyReply, FastifyRequest } from "fastify";
import { DailyUpdateService } from "./service";
import { ok } from "../../utils/response";
import type { ListDailyUpdatesQuery, UpsertTodayUpdateInput } from "./schemas";

export class DailyUpdateController {
  constructor(private readonly service: DailyUpdateService) {}

  upsertToday = async (request: FastifyRequest, reply: FastifyReply) => {
    const update = await this.service.upsertToday(request.authUser, request.body as UpsertTodayUpdateInput);
    return reply.send(ok(update));
  };

  today = async (request: FastifyRequest, reply: FastifyReply) => {
    const update = await this.service.today(request.authUser);
    return reply.send(ok(update));
  };

  myHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.myHistory(request.authUser, request.query as ListDailyUpdatesQuery);
    return reply.send(ok(result));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser, request.query as ListDailyUpdatesQuery);
    return reply.send(ok(result));
  };

  todaySummary = async (request: FastifyRequest, reply: FastifyReply) => {
    const summary = await this.service.todaySummary(request.authUser);
    return reply.send(ok(summary));
  };
}
