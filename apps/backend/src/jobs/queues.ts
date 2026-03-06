import { Queue } from "bullmq";
import { env } from "../config.js";

export const priceQueue = new Queue("price-fetch", {
  connection: { url: env.REDIS_URL },
});

// Repeat every 5 minutes
await priceQueue.upsertJobScheduler(
  "fetch-prices",
  { every: 5 * 60 * 1000 },
  { name: "fetch-prices" }
);
