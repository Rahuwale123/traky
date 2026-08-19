import type { FastifyReply, FastifyRequest } from "fastify";
import { DesignationService } from "./service";
import { ok } from "../../utils/response";
import type { CreateDesignationInput, ListDesignationsQuery, UpdateDesignationInput } from "./schemas";

export class DesignationController {
  constructor(private readonly service: DesignationService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const items = await this.service.list(request.authUser.organizationId, request.query as ListDesignationsQuery);
    return reply.send(ok(items));
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const created = await this.service.create(
      request.authUser.organizationId,
      request.authUser.userId,
      request.body as CreateDesignationInput,
    );
    return reply.code(201).send(ok(created));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const updated = await this.service.update(
      request.authUser.organizationId,
      request.authUser.userId,
      id,
      request.body as UpdateDesignationInput,
    );
    return reply.send(ok(updated));
  };
}
