import type { FastifyInstance } from "fastify";
import { DesignationService } from "./service";
import { DesignationController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

// Read-only by design — the catalog is platform-seeded, never user-created.
export default async function designationRoutes(app: FastifyInstance) {
  const service = new DesignationService(app.db);
  const controller = new DesignationController(service);

  app.get("/", { preHandler: [authenticate, authorize(["ADMIN", "MANAGER"])] }, controller.list);
}
