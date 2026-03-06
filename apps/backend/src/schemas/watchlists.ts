import { z } from "zod";

export const createWatchlistSchema = z.object({
  name: z.string().min(1),
});

export const addAssetSchema = z.object({
  assetId: z.string().uuid(),
});
