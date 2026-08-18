import { z } from "zod";

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  managerId: z.string().uuid().nullable(),
  designationId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const createManagerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  designationId: z.string().uuid().optional(),
});
export type CreateManagerInput = z.infer<typeof createManagerSchema>;

export const createEmployeeSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  managerId: z.string().uuid().nullable().optional(),
  designationId: z.string().uuid().optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
  designationId: z.string().uuid().nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const assignManagerSchema = z.object({
  managerId: z.string().uuid(),
});
export type AssignManagerInput = z.infer<typeof assignManagerSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  managerId: z.string().uuid().optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
