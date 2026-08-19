import { z } from "zod";
import { isValidTimeZone } from "../../utils/timezone";

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  createdAt: z.string(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  timezone: z
    .string()
    .refine(isValidTimeZone, { message: "Not a recognized IANA timezone (e.g. \"America/New_York\")" })
    .optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
