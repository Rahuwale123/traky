import type { FastifyInstance } from "fastify";
import { ActivityService } from "./service";
import { ActivityController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { listActivitiesQuerySchema } from "./schemas";

export default async function activityRoutes(app: FastifyInstance) {
  const service = new ActivityService(app.db);
  const controller = new ActivityController(service);

  app.get(
    "/",
    { preHandler: [authenticate, authorize(["ADMIN"])], schema: { querystring: listActivitiesQuerySchema } },
    controller.list,
  );
}
