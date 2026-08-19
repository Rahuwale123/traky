import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DesignationService } from "./service";
import { DesignationController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { createDesignationSchema, listDesignationsQuerySchema, updateDesignationSchema } from "./schemas";

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function designationRoutes(app: FastifyInstance) {
  const service = new DesignationService(app.db);
  const controller = new DesignationController(service);

  app.get(
    "/",
    { preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])], schema: { querystring: listDesignationsQuerySchema } },
    controller.list,
  );

  // Creating/editing titles is ADMIN-only, and scoped to the admin's own org
  // (see service.update) — platform-wide defaults stay read-only for everyone.
  app.post(
    "/",
    { preHandler: [authenticate, authorize(["ADMIN"])], schema: { body: createDesignationSchema } },
    controller.create,
  );
  app.patch(
    "/:id",
    {
      preHandler: [authenticate, authorize(["ADMIN"])],
      schema: { params: idParamsSchema, body: updateDesignationSchema },
    },
    controller.update,
  );
}
