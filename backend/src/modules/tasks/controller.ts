import type { FastifyReply, FastifyRequest } from "fastify";
import { TaskService } from "./service";
import { ok } from "../../utils/response";
import type {
  CreateCommentInput,
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./schemas";

export class TaskController {
  constructor(private readonly service: TaskService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const task = await this.service.create(request.authUser, request.body as CreateTaskInput);
    return reply.code(201).send(ok(task));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser, request.query as ListTasksQuery);
    return reply.send(ok(result));
  };

  myTasks = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.myTasks(request.authUser, request.query as ListTasksQuery);
    return reply.send(ok(result));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const task = await this.service.getById(request.authUser, id);
    return reply.send(ok(task));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const task = await this.service.update(request.authUser, id, request.body as UpdateTaskInput);
    return reply.send(ok(task));
  };

  updateStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const task = await this.service.updateStatus(request.authUser, id, request.body as UpdateTaskStatusInput);
    return reply.send(ok(task));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.service.remove(request.authUser, id);
    return reply.send(ok({ deleted: true }));
  };

  listComments = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const comments = await this.service.listComments(request.authUser, id);
    return reply.send(ok(comments));
  };

  addComment = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const comment = await this.service.addComment(request.authUser, id, request.body as CreateCommentInput);
    return reply.code(201).send(ok(comment));
  };
}
