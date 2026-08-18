import { api } from "../../lib/api";
import type { Paginated } from "../admin/types";
import type {
  ChatContact,
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
  CreateConversationPayload,
  ListMessagesParams,
} from "./types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function listContacts(): Promise<ChatContact[]> {
  const res = await api.get<Envelope<ChatContact[]>>("/chat/contacts");
  return res.data.data;
}

export async function createConversation(payload: CreateConversationPayload): Promise<ConversationDetail> {
  const res = await api.post<Envelope<ConversationDetail>>("/chat/conversations", payload);
  return res.data.data;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await api.get<Envelope<ConversationSummary[]>>("/chat/conversations");
  return res.data.data;
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const res = await api.get<Envelope<ConversationDetail>>(`/chat/conversations/${id}`);
  return res.data.data;
}

export async function listMessages(id: string, params: ListMessagesParams = {}): Promise<Paginated<ChatMessage>> {
  const res = await api.get<Envelope<Paginated<ChatMessage>>>(`/chat/conversations/${id}/messages`, { params });
  return res.data.data;
}

export async function sendMessage(id: string, body: string): Promise<ChatMessage> {
  const res = await api.post<Envelope<ChatMessage>>(`/chat/conversations/${id}/messages`, { body });
  return res.data.data;
}

export async function markConversationRead(id: string): Promise<void> {
  await api.post(`/chat/conversations/${id}/read`);
}

export async function fetchChatUnreadCount(): Promise<number> {
  const res = await api.get<Envelope<{ count: number }>>("/chat/unread-count");
  return res.data.data.count;
}

export async function addParticipants(id: string, participantIds: string[]): Promise<void> {
  await api.post(`/chat/conversations/${id}/participants`, { participantIds });
}

export async function leaveConversation(id: string): Promise<void> {
  await api.post(`/chat/conversations/${id}/leave`);
}
