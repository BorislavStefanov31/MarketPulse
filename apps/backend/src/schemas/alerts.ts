import { z } from "zod";

export const createAlertSchema = z.object({
  assetId: z.string().uuid(),
  targetPrice: z.number().positive(),
});

export const updateAlertSchema = z.object({
  isActive: z.boolean(),
});
