import { z } from "zod";

export const taskStatusValues = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: z.enum(taskPriorityValues).optional(),
  dueDate: z.string().date().nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  dueDate: z.string().date().nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatusValues),
});
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(taskStatusValues).optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const createCommentSchema = z.object({
  body: z.string().min(1).max(4000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
