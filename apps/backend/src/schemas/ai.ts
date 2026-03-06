import { z } from "zod";

export const generateReportSchema = z.object({
  assetId: z.string(),
});
