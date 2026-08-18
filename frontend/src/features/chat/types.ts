import type { Role } from "../auth/types";

export type ConversationType = "DIRECT" | "GROUP";

export interface ChatContact {
  id: string;
  fullName: string;
  role: Role;
}

export interface ChatParticipant {
  id: string;
  fullName: string;
  role: Role;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string;
  participants: { id: string; fullName: string }[];
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  organizationId: string;
  type: ConversationType;
  name: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
}

export interface ChatMessage {
  id: string;
  organizationId: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export type CreateConversationPayload =
  | { type: "DIRECT"; participantId: string }
  | { type: "GROUP"; name: string; participantIds: string[] };

export interface ListMessagesParams {
  page?: number;
  pageSize?: number;
}

export interface ChatPushEvent {
  type: "message:new";
  conversationId: string;
  message: ChatMessage;
}
