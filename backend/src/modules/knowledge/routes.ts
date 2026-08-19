import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { KnowledgeService } from "./service";
import { KnowledgeController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { createResourceSchema, listResourcesQuerySchema, rejectResourceSchema } from "./schemas";

const idParamsSchema = z.object({ id: z.string().uuid() });

// Every role can share and browse — visibility/approval rules live in the
// service, not route-level authorize() gates, since they depend on scope and
// reporting lines, not just role.
export default async function knowledgeRoutes(app: FastifyInstance) {
  const service = new KnowledgeService(app.db);
  const controller = new KnowledgeController(service);

  app.post("/", { preHandler: [authenticate], schema: { body: createResourceSchema } }, controller.create);
  app.get("/", { preHandler: [authenticate], schema: { querystring: listResourcesQuerySchema } }, controller.list);
  app.get("/:id", { preHandler: [authenticate], schema: { params: idParamsSchema } }, controller.getById);
  app.post("/:id/approve", { preHandler: [authenticate], schema: { params: idParamsSchema } }, controller.approve);
  app.post(
    "/:id/reject",
    { preHandler: [authenticate], schema: { params: idParamsSchema, body: rejectResourceSchema } },
    controller.reject,
  );
  app.delete("/:id", { preHandler: [authenticate], schema: { params: idParamsSchema } }, controller.remove);
}
