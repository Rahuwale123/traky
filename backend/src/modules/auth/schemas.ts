import { z } from "zod";

export const registerOrgSchema = z.object({
  organizationName: z.string().min(2).max(120),
  adminFullName: z.string().min(2).max(120),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(72),
});
export type RegisterOrgInput = z.infer<typeof registerOrgSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  managerId: z.string().uuid().nullable(),
  designationId: z.string().uuid().nullable(),
});

export const loginResponseSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
});
