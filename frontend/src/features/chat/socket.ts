import { queryClient } from "../../lib/queryClient";
import { useAuthStore } from "../../stores/authStore";
import type { ChatPushEvent } from "./types";

const WS_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4100/api/v1").replace(/^http/, "ws");
const RECONNECT_DELAY_MS = 3000;

let socket: WebSocket | null = null;
let currentToken: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function handlePushEvent(event: ChatPushEvent) {
  if (event.type !== "message:new") return;
  queryClient.invalidateQueries({ queryKey: ["chat", "messages", event.conversationId] });
  queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
  queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
}

function connect(token: string) {
  if (socket && currentToken === token && socket.readyState <= WebSocket.OPEN) return;

  currentToken = token;
  socket = new WebSocket(`${WS_BASE}/chat/ws?token=${encodeURIComponent(token)}`);

  socket.addEventListener("message", (evt) => {
    try {
      handlePushEvent(JSON.parse(evt.data as string) as ChatPushEvent);
    } catch {
      // Ignore malformed frames.
    }
  });

  socket.addEventListener("close", () => {
    if (currentToken !== token) return; // Superseded by a newer connection or logout.
    reconnectTimer = setTimeout(() => {
      const latestToken = useAuthStore.getState().accessToken;
      if (latestToken) connect(latestToken);
    }, RECONNECT_DELAY_MS);
  });
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  currentToken = null;
  socket?.close();
  socket = null;
}

/** Call once at app startup. Connects/reconnects the chat WebSocket as the auth session changes. */
export function initChatSocket() {
  if (initialized) return;
  initialized = true;

  useAuthStore.subscribe((state, prevState) => {
    if (state.accessToken === prevState.accessToken) return;
    if (state.accessToken) connect(state.accessToken);
    else disconnect();
  });

  const token = useAuthStore.getState().accessToken;
  if (token) connect(token);
}
