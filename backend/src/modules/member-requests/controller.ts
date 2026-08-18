import type { FastifyReply, FastifyRequest } from "fastify";
import { MemberRequestService } from "./service";
import { ok } from "../../utils/response";
import type { CreateMemberRequestInput, ListMemberRequestsQuery, RespondMemberRequestInput } from "./schemas";

export class MemberRequestController {
  constructor(private readonly service: MemberRequestService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const created = await this.service.create(request.authUser, request.body as CreateMemberRequestInput);
    return reply.code(201).send(ok(created));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser, request.query as ListMemberRequestsQuery);
    return reply.send(ok(result));
  };

  respond = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const updated = await this.service.respond(request.authUser, id, request.body as RespondMemberRequestInput);
    return reply.send(ok(updated));
  };
}
