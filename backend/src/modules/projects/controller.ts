import type { FastifyReply, FastifyRequest } from "fastify";
import { ProjectService } from "./service";
import { ok } from "../../utils/response";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "./schemas";

export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const project = await this.service.create(request.authUser, request.body as CreateProjectInput);
    return reply.code(201).send(ok(project));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser, request.query as ListProjectsQuery);
    return reply.send(ok(result));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const project = await this.service.getById(request.authUser, id);
    return reply.send(ok(project));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const project = await this.service.update(request.authUser, id, request.body as UpdateProjectInput);
    return reply.send(ok(project));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.service.remove(request.authUser, id);
    return reply.send(ok({ deleted: true }));
  };
}
