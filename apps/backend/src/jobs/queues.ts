import { Queue } from "bullmq";
import { env } from "../config.js";

export const priceQueue = new Queue("price-fetch", {
  connection: { url: env.REDIS_URL },
});

// Repeat every 1 minute
await priceQueue.upsertJobScheduler(
  "fetch-prices",
  { every: 1 * 60 * 1000 },
  { name: "fetch-prices" }
);
