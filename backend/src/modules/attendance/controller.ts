import type { FastifyReply, FastifyRequest } from "fastify";
import { AttendanceService } from "./service";
import { ok } from "../../utils/response";
import type { ListAttendanceQuery, StartBreakInput } from "./schemas";

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

  startBreak = async (request: FastifyRequest, reply: FastifyReply) => {
    const breakLog = await this.service.startBreak(request.authUser, request.body as StartBreakInput);
    return reply.code(201).send(ok(breakLog));
  };

  endBreak = async (request: FastifyRequest, reply: FastifyReply) => {
    const breakLog = await this.service.endBreak(request.authUser);
    return reply.send(ok(breakLog));
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
