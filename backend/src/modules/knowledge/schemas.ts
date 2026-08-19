import { z } from "zod";

export const createResourceSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("GLOBAL"),
    title: z.string().trim().min(2).max(200),
    url: z.string().trim().url(),
    description: z.string().trim().max(2000).optional(),
  }),
  z.object({
    scope: z.literal("TEAM"),
    title: z.string().trim().min(2).max(200),
    url: z.string().trim().url(),
    description: z.string().trim().max(2000).optional(),
    // Only meaningful for ADMIN, who can target any manager's team — a
    // MANAGER/EMPLOYEE's own team is inferred server-side and this is ignored.
    teamManagerId: z.string().uuid().optional(),
  }),
  z.object({
    scope: z.literal("PROJECT"),
    title: z.string().trim().min(2).max(200),
    url: z.string().trim().url(),
    description: z.string().trim().max(2000).optional(),
    projectId: z.string().uuid(),
  }),
]);
export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const rejectResourceSchema = z.preprocess(
  (v) => v ?? {},
  z.object({
    note: z.string().trim().max(500).optional(),
  }),
);
export type RejectResourceInput = z.infer<typeof rejectResourceSchema>;

export const listResourcesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(200).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  scope: z.enum(["GLOBAL", "TEAM", "PROJECT"]).optional(),
  projectId: z.string().uuid().optional(),
});
export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>;
