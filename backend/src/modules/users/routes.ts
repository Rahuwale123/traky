import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { UserService } from "./service";
import { UserController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  assignManagerSchema,
  createEmployeeSchema,
  createManagerSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "./schemas";

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function userRoutes(app: FastifyInstance) {
  const service = new UserService(app.db);
  const controller = new UserController(service);

  app.post(
    "/managers",
    { preHandler: [authenticate, authorize(["ADMIN"])], schema: { body: createManagerSchema } },
    controller.createManager,
  );

  app.post(
    "/employees",
    { preHandler: [authenticate, authorize(["ADMIN"])], schema: { body: createEmployeeSchema } },
    controller.createEmployee,
  );

  app.get(
    "/",
    { preHandler: [authenticate, authorize(["ADMIN"])], schema: { querystring: listUsersQuerySchema } },
    controller.list,
  );

  app.get(
    "/my-team",
    { preHandler: [authenticate, authorize(["MANAGER"])], schema: { querystring: listUsersQuerySchema } },
    controller.myTeam,
  );

  app.get(
    "/:id",
    { preHandler: [authenticate, authorize(["ADMIN"])], schema: { params: idParamsSchema } },
    controller.getById,
  );

  app.patch(
    "/:id",
    {
      preHandler: [authenticate, authorize(["ADMIN"])],
      schema: { params: idParamsSchema, body: updateUserSchema },
    },
    controller.update,
  );

  app.patch(
    "/:id/assign-manager",
    {
      preHandler: [authenticate, authorize(["ADMIN"])],
      schema: { params: idParamsSchema, body: assignManagerSchema },
    },
    controller.assignManager,
  );
}
