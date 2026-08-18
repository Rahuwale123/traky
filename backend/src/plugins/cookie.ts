import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";

export default fp(async function cookiePlugin(app: FastifyInstance) {
  await app.register(cookie);
});
