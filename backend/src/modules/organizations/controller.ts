import type { FastifyReply, FastifyRequest } from "fastify";
import { OrganizationService } from "./service";
import { ok } from "../../utils/response";
import type { UpdateOrganizationInput } from "./schemas";

export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  getMine = async (request: FastifyRequest, reply: FastifyReply) => {
    const org = await this.service.getById(request.authUser.organizationId);
    return reply.send(ok(org));
  };

  updateMine = async (request: FastifyRequest, reply: FastifyReply) => {
    const org = await this.service.update(
      request.authUser.organizationId,
      request.authUser.userId,
      request.body as UpdateOrganizationInput,
    );
    return reply.send(ok(org));
  };
}
