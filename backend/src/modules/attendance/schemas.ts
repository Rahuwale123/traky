import { z } from "zod";

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  userId: z.string().uuid().optional(),
  date: z.string().date().optional(), // yyyy-mm-dd, filters to that single day
  startDate: z.string().date().optional(), // yyyy-mm-dd, inclusive range start
  endDate: z.string().date().optional(), // yyyy-mm-dd, inclusive range end
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
