import { z } from "zod";

export const createMemberRequestSchema = z.object({
  designationId: z.string().uuid().optional(),
  note: z.string().trim().min(1).max(2000),
});
export type CreateMemberRequestInput = z.infer<typeof createMemberRequestSchema>;

export const respondMemberRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  responseNote: z.string().trim().max(2000).optional(),
});
export type RespondMemberRequestInput = z.infer<typeof respondMemberRequestSchema>;

export const listMemberRequestsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
export type ListMemberRequestsQuery = z.infer<typeof listMemberRequestsQuerySchema>;
