import type { FastifyReply, FastifyRequest } from "fastify";
import { AttendanceService } from "./service";
import { ok } from "../../utils/response";
import type { ListAttendanceQuery } from "./schemas";

export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  punchIn = async (request: FastifyRequest, reply: FastifyReply) => {
    const log = await this.service.punchIn(request.authUser);
    return reply.code(201).send(ok(log));
  };

  punchOut = async (request: FastifyRequest, reply: FastifyReply) => {
    const log = await this.service.punchOut(request.authUser);
    return reply.send(ok(log));
  };

  today = async (request: FastifyRequest, reply: FastifyReply) => {
    const summary = await this.service.today(request.authUser);
    return reply.send(ok(summary));
  };

  myHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.myHistory(request.authUser, request.query as ListAttendanceQuery);
    return reply.send(ok(result));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser, request.query as ListAttendanceQuery);
    return reply.send(ok(result));
  };

  todaySummary = async (request: FastifyRequest, reply: FastifyReply) => {
    const summary = await this.service.todaySummary(request.authUser);
    return reply.send(ok(summary));
  };
}
