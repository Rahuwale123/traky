import { z } from "zod";

export const createConversationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("DIRECT"),
    participantId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("GROUP"),
    name: z.string().trim().min(1).max(100),
    participantIds: z.array(z.string().uuid()).min(1),
  }),
]);
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

export const addParticipantsSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1),
});
export type AddParticipantsInput = z.infer<typeof addParticipantsSchema>;
