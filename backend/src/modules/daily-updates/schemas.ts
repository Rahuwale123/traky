import { z } from "zod";

export const upsertTodayUpdateSchema = z.object({
  summary: z.string().trim().min(1).max(4000),
  blockers: z.string().trim().max(2000).nullable().optional(),
  planForTomorrow: z.string().trim().max(2000).nullable().optional(),
});
export type UpsertTodayUpdateInput = z.infer<typeof upsertTodayUpdateSchema>;

export const listDailyUpdatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});
export type ListDailyUpdatesQuery = z.infer<typeof listDailyUpdatesQuerySchema>;
