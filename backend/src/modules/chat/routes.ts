import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ChatService } from "./service";
import { ChatController } from "./controller";
import { authenticate } from "../../middleware/authenticate";
import {
  addParticipantsSchema,
  createConversationSchema,
  listMessagesQuerySchema,
  sendMessageSchema,
} from "./schemas";
import type { AuthUserContext } from "../../shared/types";

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function chatRoutes(app: FastifyInstance) {
  const service = new ChatService(app.db, app);
  const controller = new ChatController(service);

  // Any authenticated role can use chat — org membership is the only boundary.
  app.get("/contacts", { preHandler: [authenticate] }, controller.listContacts);

  app.post(
    "/conversations",
    { preHandler: [authenticate], schema: { body: createConversationSchema } },
    controller.createConversation,
  );
  app.get("/conversations", { preHandler: [authenticate] }, controller.listConversations);
  app.get(
    "/conversations/:id",
    { preHandler: [authenticate], schema: { params: idParamsSchema } },
    controller.getById,
  );
  app.get(
    "/conversations/:id/messages",
    { preHandler: [authenticate], schema: { params: idParamsSchema, querystring: listMessagesQuerySchema } },
    controller.listMessages,
  );
  app.post(
    "/conversations/:id/messages",
    { preHandler: [authenticate], schema: { params: idParamsSchema, body: sendMessageSchema } },
    controller.sendMessage,
  );
  app.post(
    "/conversations/:id/read",
    { preHandler: [authenticate], schema: { params: idParamsSchema } },
    controller.markRead,
  );
  app.post(
    "/conversations/:id/participants",
    { preHandler: [authenticate], schema: { params: idParamsSchema, body: addParticipantsSchema } },
    controller.addParticipants,
  );
  app.post(
    "/conversations/:id/leave",
    { preHandler: [authenticate], schema: { params: idParamsSchema } },
    controller.leave,
  );

  app.get("/unread-count", { preHandler: [authenticate] }, controller.unreadCount);

  // WebSocket connection for real-time push. The browser WebSocket API can't
  // set an Authorization header, so the access token travels as a query param
  // and is verified manually here instead of via the usual authenticate hook.
  app.get("/ws", { websocket: true }, (socket, request) => {
    const { token } = request.query as { token?: string };
    if (!token) {
      socket.close(4001, "Missing token");
      return;
    }

    let payload: AuthUserContext;
    try {
      payload = app.jwt.verify<AuthUserContext>(token);
    } catch {
      socket.close(4001, "Invalid token");
      return;
    }

    app.registerChatSocket(payload.userId, socket);

    socket.on("close", () => app.unregisterChatSocket(payload.userId, socket));
    socket.on("error", () => app.unregisterChatSocket(payload.userId, socket));
  });
}
