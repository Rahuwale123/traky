import type { FastifyInstance } from "fastify";
import { AttendanceService } from "./service";
import { AttendanceController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { listAttendanceQuerySchema, startBreakSchema } from "./schemas";

export default async function attendanceRoutes(app: FastifyInstance) {
  const service = new AttendanceService(app.db);
  const controller = new AttendanceController(service);

  // Self-service punch clock — managers and employees only (admins don't log hours).
  app.post("/punch-in", { preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])] }, controller.punchIn);
  app.post("/punch-out", { preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])] }, controller.punchOut);
  app.post(
    "/break/start",
    { preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])], schema: { body: startBreakSchema } },
    controller.startBreak,
  );
  app.post("/break/end", { preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])] }, controller.endBreak);
  app.get("/today", { preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])] }, controller.today);
  app.get(
    "/me",
    {
      preHandler: [authenticate, authorize(["MANAGER", "EMPLOYEE"])],
      schema: { querystring: listAttendanceQuerySchema },
    },
    controller.myHistory,
  );

  // Oversight — ADMIN sees the org, MANAGER sees their own team (+ themselves).
  app.get(
    "/",
    {
      preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])],
      schema: { querystring: listAttendanceQuerySchema },
    },
    controller.list,
  );
  app.get("/today-summary", { preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])] }, controller.todaySummary);
}
