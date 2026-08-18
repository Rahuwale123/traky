import type { FastifyReply, FastifyRequest } from "fastify";
import { DesignationService } from "./service";
import { ok } from "../../utils/response";

export class DesignationController {
  constructor(private readonly service: DesignationService) {}

  list = async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await this.service.list();
    return reply.send(ok(items));
  };
}
