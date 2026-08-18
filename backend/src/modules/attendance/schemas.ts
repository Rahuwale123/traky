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

// An empty request body (no Content-Type, nothing sent) parses to `null` in
// Fastify, not `undefined` — preprocess so a body-less POST still validates.
export const startBreakSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    reason: z.string().trim().max(200).optional(),
  }),
);
export type StartBreakInput = z.infer<typeof startBreakSchema>;
