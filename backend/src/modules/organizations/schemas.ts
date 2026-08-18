import { z } from "zod";

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
