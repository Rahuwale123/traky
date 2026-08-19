import type { FastifyReply, FastifyRequest } from "fastify";
import { KnowledgeService } from "./service";
import { ok } from "../../utils/response";
import type { CreateResourceInput, ListResourcesQuery, RejectResourceInput } from "./schemas";

export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const created = await this.service.create(request.authUser, request.body as CreateResourceInput);
    return reply.code(201).send(ok(created));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser, request.query as ListResourcesQuery);
    return reply.send(ok(result));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const resource = await this.service.getById(request.authUser, id);
    return reply.send(ok(resource));
  };

  approve = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const resource = await this.service.approve(request.authUser, id);
    return reply.send(ok(resource));
  };

  reject = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const resource = await this.service.reject(request.authUser, id, request.body as RejectResourceInput);
    return reply.send(ok(resource));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.service.remove(request.authUser, id);
    return reply.send(ok({ removed: true }));
  };
}
