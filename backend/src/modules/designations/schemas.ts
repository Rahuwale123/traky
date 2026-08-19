import { z } from "zod";

export const listDesignationsQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
});
export type ListDesignationsQuery = z.infer<typeof listDesignationsQuerySchema>;

export const createDesignationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(60),
});
export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;

export const updateDesignationSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    category: z.string().trim().min(2).max(60).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.category !== undefined || v.isActive !== undefined, {
    message: "Provide at least one field to update",
  });
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
