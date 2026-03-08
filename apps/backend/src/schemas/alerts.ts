import { z } from "zod";

export const createAlertSchema = z.object({
  assetId: z.string().uuid(),
  type: z.enum(["ABOVE", "BELOW"]),
  targetPrice: z.number().positive(),
});

export const updateAlertSchema = z.object({
  isActive: z.boolean(),
});
