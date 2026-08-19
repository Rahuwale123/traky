import type { FastifyReply, FastifyRequest } from "fastify";
import { ActivityService } from "./service";
import { ok } from "../../utils/response";
import type { ListActivitiesQuery } from "./schemas";

export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.service.list(request.authUser.organizationId, request.query as ListActivitiesQuery);
    return reply.send(ok(result));
  };
}
