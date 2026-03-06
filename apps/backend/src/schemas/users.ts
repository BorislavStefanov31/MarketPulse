import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});
