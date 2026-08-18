import type { FastifyInstance } from "fastify";
import { DailyUpdateService } from "./service";
import { DailyUpdateController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { listDailyUpdatesQuerySchema, upsertTodayUpdateSchema } from "./schemas";

export default async function dailyUpdateRoutes(app: FastifyInstance) {
  const service = new DailyUpdateService(app.db);
  const controller = new DailyUpdateController(service);

  // Self-service — managers and employees only (admins don't file EOD updates).
  app.put(
    "/today",
    {
      preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])],
      schema: { body: upsertTodayUpdateSchema },
    },
    controller.upsertToday,
  );
  app.get("/today", { preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])] }, controller.today);
  app.get(
    "/me",
    {
      preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])],
      schema: { querystring: listDailyUpdatesQuerySchema },
    },
    controller.myHistory,
  );

  // Oversight — ADMIN sees the org, MANAGER sees their own team (+ themselves).
  app.get(
    "/",
    {
      preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])],
      schema: { querystring: listDailyUpdatesQuerySchema },
    },
    controller.list,
  );
  app.get(
    "/today-summary",
    { preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])] },
    controller.todaySummary,
  );
}
