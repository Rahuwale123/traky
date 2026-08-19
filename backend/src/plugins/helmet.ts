import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";

export default fp(async function helmetPlugin(app: FastifyInstance) {
  await app.register(helmet, {
    // This is a JSON/WebSocket API with no server-rendered HTML, so a
    // content-security-policy tuned for pages (script-src, style-src, etc.)
    // doesn't apply here — the rest of helmet's defaults (HSTS, X-Frame-Options,
    // X-Content-Type-Options, etc.) still add real value and stay on.
    contentSecurityPolicy: false,
  });
});
