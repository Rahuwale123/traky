import type { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./service";
import { ok } from "../../utils/response";
import { toSafeUser, toSafeUsers } from "../../utils/sanitize";
import type {
  AssignManagerInput,
  CreateEmployeeInput,
  CreateManagerInput,
  ListUsersQuery,
  UpdateUserInput,
} from "./schemas";

export class UserController {
  constructor(private readonly service: UserService) {}

  createManager = async (request: FastifyRequest, reply: FastifyReply) => {
    const manager = await this.service.createManager(
      request.authUser.organizationId,
      request.authUser.userId,
      request.body as CreateManagerInput,
    );
    return reply.code(201).send(ok(toSafeUser(manager)));
  };

  createEmployee = async (request: FastifyRequest, reply: FastifyReply) => {
    const employee = await this.service.createEmployee(
      request.authUser.organizationId,
      request.authUser.userId,
      request.body as CreateEmployeeInput,
    );
    return reply.code(201).send(ok(toSafeUser(employee)));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser.organizationId, request.query as ListUsersQuery);
    return reply.send(ok({ ...result, items: toSafeUsers(result.items) }));
  };

  myTeam = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.myTeam(
      request.authUser.organizationId,
      request.authUser.userId,
      request.query as ListUsersQuery,
    );
    return reply.send(ok({ ...result, items: toSafeUsers(result.items) }));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await this.service.getById(request.authUser.organizationId, id);
    return reply.send(ok(toSafeUser(user)));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await this.service.update(
      request.authUser.organizationId,
      request.authUser.userId,
      id,
      request.body as UpdateUserInput,
    );
    return reply.send(ok(toSafeUser(user)));
  };

  assignManager = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await this.service.assignManager(
      request.authUser.organizationId,
      request.authUser.userId,
      id,
      request.body as AssignManagerInput,
    );
    return reply.send(ok(toSafeUser(user)));
  };
}
