import { z } from "zod";

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  entityType: z.string().optional(),
  type: z.string().optional(),
});
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
