import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addParticipants,
  createConversation,
  fetchChatUnreadCount,
  getConversation,
  leaveConversation,
  listContacts,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from "./api";
import type { CreateConversationPayload, ListMessagesParams } from "./types";

export function useChatContacts() {
  return useQuery({ queryKey: ["chat", "contacts"], queryFn: listContacts });
}

export function useConversations() {
  return useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: listConversations,
    refetchInterval: 30_000,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ["chat", "conversation", id],
    queryFn: () => getConversation(id!),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string | undefined, params: ListMessagesParams = {}) {
  return useQuery({
    queryKey: ["chat", "messages", conversationId, params],
    queryFn: () => listMessages(conversationId!, params),
    enabled: !!conversationId,
  });
}

export function useChatUnreadCount() {
  return useQuery({
    queryKey: ["chat", "unread-count"],
    queryFn: fetchChatUnreadCount,
    refetchInterval: 30_000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConversationPayload) => createConversation(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
    },
  });
}

export function useAddParticipants(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantIds: string[]) => addParticipants(conversationId, participantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useLeaveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => leaveConversation(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });
}
