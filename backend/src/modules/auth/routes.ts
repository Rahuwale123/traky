import type { FastifyInstance } from "fastify";
import { AuthService } from "./service";
import { AuthController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import {
  forgotPasswordSchema,
  loginResponseSchema,
  loginSchema,
  registerOrgSchema,
  resetPasswordSchema,
} from "./schemas";
import { z } from "zod";

export default async function authRoutes(app: FastifyInstance) {
  const service = new AuthService(app.db, app.redis, app);
  const controller = new AuthController(service);

  app.post(
    "/register-org",
    {
      schema: {
        body: registerOrgSchema,
        response: { 201: z.object({ success: z.literal(true), data: loginResponseSchema, error: z.null() }) },
      },
    },
    controller.registerOrg,
  );

  app.post(
    "/login",
    {
      schema: {
        body: loginSchema,
        response: { 200: z.object({ success: z.literal(true), data: loginResponseSchema, error: z.null() }) },
      },
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    controller.login,
  );

  app.post("/refresh", {}, controller.refresh);
  app.post("/logout", {}, controller.logout);

  app.get("/me", { preHandler: [authenticate] }, controller.me);

  // Deliberately tighter than the global limit — these are the two endpoints most
  // attractive to abuse (email enumeration / spam, credential brute-forcing).
  app.post(
    "/forgot-password",
    { schema: { body: forgotPasswordSchema }, config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    controller.forgotPassword,
  );
  app.post(
    "/reset-password",
    { schema: { body: resetPasswordSchema }, config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    controller.resetPassword,
  );
}
