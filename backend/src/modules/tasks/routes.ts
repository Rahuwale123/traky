import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { TaskService } from "./service";
import { TaskController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  createCommentSchema,
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./schemas";

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function taskRoutes(app: FastifyInstance) {
  const service = new TaskService(app.db);
  const controller = new TaskController(service);

  app.post(
    "/",
    { preHandler: [authenticate, authorize(["MANAGER"])], schema: { body: createTaskSchema } },
    controller.create,
  );

  app.get(
    "/",
    {
      preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])],
      schema: { querystring: listTasksQuerySchema },
    },
    controller.list,
  );

  app.get(
    "/my-tasks",
    { preHandler: [authenticate, authorize(["EMPLOYEE"])], schema: { querystring: listTasksQuerySchema } },
    controller.myTasks,
  );

  app.get(
    "/:id",
    { preHandler: [authenticate], schema: { params: idParamsSchema } },
    controller.getById,
  );

  app.patch(
    "/:id",
    {
      preHandler: [authenticate, authorize(["MANAGER"])],
      schema: { params: idParamsSchema, body: updateTaskSchema },
    },
    controller.update,
  );

  app.patch(
    "/:id/status",
    {
      preHandler: [authenticate, authorize(["EMPLOYEE"])],
      schema: { params: idParamsSchema, body: updateTaskStatusSchema },
    },
    controller.updateStatus,
  );

  app.delete(
    "/:id",
    { preHandler: [authenticate, authorize(["MANAGER"])], schema: { params: idParamsSchema } },
    controller.remove,
  );

  app.get(
    "/:id/comments",
    { preHandler: [authenticate], schema: { params: idParamsSchema } },
    controller.listComments,
  );

  app.post(
    "/:id/comments",
    {
      preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])],
      schema: { params: idParamsSchema, body: createCommentSchema },
    },
    controller.addComment,
  );
}
