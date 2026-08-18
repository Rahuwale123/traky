import type { FastifyInstance } from "fastify";
import { OrganizationService } from "./service";
import { OrganizationController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { updateOrganizationSchema } from "./schemas";

export default async function organizationRoutes(app: FastifyInstance) {
  const service = new OrganizationService(app.db);
  const controller = new OrganizationController(service);

  app.get("/me", { preHandler: [authenticate] }, controller.getMine);

  app.patch(
    "/me",
    {
      preHandler: [authenticate, authorize(["ADMIN"])],
      schema: { body: updateOrganizationSchema },
    },
    controller.updateMine,
  );
}
