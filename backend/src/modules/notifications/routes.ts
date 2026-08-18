import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { NotificationService } from "./service";
import { NotificationController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { listNotificationsQuerySchema } from "./schemas";

const idParamsSchema = z.object({ id: z.string().uuid() });

// Every route here is self-scoped (a user's own notifications) — open to any
// authenticated role, no authorize() gate needed beyond being logged in.
export default async function notificationRoutes(app: FastifyInstance) {
  const service = new NotificationService(app.db);
  const controller = new NotificationController(service);

  app.get("/", { preHandler: [authenticate], schema: { querystring: listNotificationsQuerySchema } }, controller.list);
  app.get("/unread-count", { preHandler: [authenticate] }, controller.unreadCount);
  app.post("/:id/read", { preHandler: [authenticate], schema: { params: idParamsSchema } }, controller.markRead);
  app.post("/read-all", { preHandler: [authenticate] }, controller.markAllRead);
}
