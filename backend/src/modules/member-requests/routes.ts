import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MemberRequestService } from "./service";
import { MemberRequestController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { createMemberRequestSchema, listMemberRequestsQuerySchema, respondMemberRequestSchema } from "./schemas";

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function memberRequestRoutes(app: FastifyInstance) {
  const service = new MemberRequestService(app.db);
  const controller = new MemberRequestController(service);

  app.post(
    "/",
    { preHandler: [authenticate, authorize(["MANAGER"])], schema: { body: createMemberRequestSchema } },
    controller.create,
  );

  // ADMIN sees every request in the org; MANAGER sees only their own (enforced in the service).
  app.get(
    "/",
    {
      preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])],
      schema: { querystring: listMemberRequestsQuerySchema },
    },
    controller.list,
  );

  app.patch(
    "/:id",
    {
      preHandler: [authenticate, authorize(["ADMIN"])],
      schema: { params: idParamsSchema, body: respondMemberRequestSchema },
    },
    controller.respond,
  );
}
