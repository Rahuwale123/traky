import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { db, pool } from "../db/client";
import type { Database } from "../db/client";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

export default fp(async function dbPlugin(app: FastifyInstance) {
  app.decorate("db", db);

  app.addHook("onClose", async () => {
    await pool.end();
  });
});
