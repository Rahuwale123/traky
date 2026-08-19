import Fastify, { type FastifyError } from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "./config/env";
import { AppError } from "./shared/errors";
import { fail } from "./utils/response";

import dbPlugin from "./plugins/db";
import redisPlugin from "./plugins/redis";
import jwtPlugin from "./plugins/jwt";
import cookiePlugin from "./plugins/cookie";
import corsPlugin from "./plugins/cors";
import rateLimitPlugin from "./plugins/rate-limit";
import websocketSupport from "./plugins/websocket";
import mailerPlugin from "./plugins/mailer";

import authRoutes from "./modules/auth/routes";
import organizationRoutes from "./modules/organizations/routes";
import userRoutes from "./modules/users/routes";
import projectRoutes from "./modules/projects/routes";
import taskRoutes from "./modules/tasks/routes";
import attendanceRoutes from "./modules/attendance/routes";
import designationRoutes from "./modules/designations/routes";
import dailyUpdateRoutes from "./modules/daily-updates/routes";
import notificationRoutes from "./modules/notifications/routes";
import memberRequestRoutes from "./modules/member-requests/routes";
import chatRoutes from "./modules/chat/routes";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport: env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(cookiePlugin);
  await app.register(dbPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);
  await app.register(websocketSupport);
  await app.register(mailerPlugin);

  // Must be registered before the route plugins below — Fastify resolves a
  // nested context's error/404 handler from what its parent had at the time
  // the child was registered, not dynamically at request time.
  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ err: error }, error.message);
      return reply.code(error.statusCode).send(fail(error.code, error.message));
    }

    if (error.validation) {
      return reply.code(400).send(fail("VALIDATION_ERROR", "Request validation failed", error.validation));
    }

    request.log.error({ err: error }, "Unhandled error");
    return reply.code(500).send(fail("INTERNAL_ERROR", "Something went wrong"));
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send(fail("NOT_FOUND", `Route ${request.method} ${request.url} not found`));
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: "/auth" });
      await api.register(organizationRoutes, { prefix: "/organizations" });
      await api.register(userRoutes, { prefix: "/users" });
      await api.register(projectRoutes, { prefix: "/projects" });
      await api.register(taskRoutes, { prefix: "/tasks" });
      await api.register(attendanceRoutes, { prefix: "/attendance" });
      await api.register(designationRoutes, { prefix: "/designations" });
      await api.register(dailyUpdateRoutes, { prefix: "/daily-updates" });
      await api.register(notificationRoutes, { prefix: "/notifications" });
      await api.register(memberRequestRoutes, { prefix: "/member-requests" });
      await api.register(chatRoutes, { prefix: "/chat" });
    },
    { prefix: "/api/v1" },
  );

  return app;
}
