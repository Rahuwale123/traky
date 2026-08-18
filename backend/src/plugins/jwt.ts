import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { env } from "../config/env";
import type { AuthUserContext } from "../shared/types";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthUserContext;
  }
}

export default fp(async function jwtPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  });
});
