import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import websocketPlugin from "@fastify/websocket";
import type { WebSocket } from "ws";

declare module "fastify" {
  interface FastifyInstance {
    chatSockets: Map<string, Set<WebSocket>>;
    registerChatSocket: (userId: string, socket: WebSocket) => void;
    unregisterChatSocket: (userId: string, socket: WebSocket) => void;
    pushToUser: (userId: string, payload: unknown) => void;
  }
}

export default fp(async function websocketSupport(app: FastifyInstance) {
  await app.register(websocketPlugin);

  const sockets = new Map<string, Set<WebSocket>>();

  app.decorate("chatSockets", sockets);

  app.decorate("registerChatSocket", (userId: string, socket: WebSocket) => {
    const existing = sockets.get(userId);
    if (existing) existing.add(socket);
    else sockets.set(userId, new Set([socket]));
  });

  app.decorate("unregisterChatSocket", (userId: string, socket: WebSocket) => {
    const existing = sockets.get(userId);
    if (!existing) return;
    existing.delete(socket);
    if (existing.size === 0) sockets.delete(userId);
  });

  app.decorate("pushToUser", (userId: string, payload: unknown) => {
    const existing = sockets.get(userId);
    if (!existing) return;
    const message = JSON.stringify(payload);
    for (const socket of existing) {
      if (socket.readyState === socket.OPEN) socket.send(message);
    }
  });
});
