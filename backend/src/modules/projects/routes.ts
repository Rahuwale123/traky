import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ProjectService } from "./service";
import { ProjectController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { createProjectSchema, listProjectsQuerySchema, updateProjectSchema } from "./schemas";

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function projectRoutes(app: FastifyInstance) {
  const service = new ProjectService(app.db);
  const controller = new ProjectController(service);

  app.post(
    "/",
    { preHandler: [authenticate, authorize(["MANAGER"])], schema: { body: createProjectSchema } },
    controller.create,
  );

  app.get(
    "/",
    {
      preHandler: [authenticate, authorize(["ADMIN", "MANAGER", "EMPLOYEE"])],
      schema: { querystring: listProjectsQuerySchema },
    },
    controller.list,
  );

  app.get(
    "/:id",
    {
      preHandler: [authenticate, authorize(["ADMIN", "MANAGER", "EMPLOYEE"])],
      schema: { params: idParamsSchema },
    },
    controller.getById,
  );

  app.patch(
    "/:id",
    {
      preHandler: [authenticate, authorize(["MANAGER"])],
      schema: { params: idParamsSchema, body: updateProjectSchema },
    },
    controller.update,
  );

  app.delete(
    "/:id",
    { preHandler: [authenticate, authorize(["MANAGER"])], schema: { params: idParamsSchema } },
    controller.remove,
  );
}
