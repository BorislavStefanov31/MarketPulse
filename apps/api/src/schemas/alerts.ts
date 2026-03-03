import { z } from "zod";

export const createAlertSchema = z.object({
  assetId: z.string(),
  targetPrice: z.number().positive(),
});
