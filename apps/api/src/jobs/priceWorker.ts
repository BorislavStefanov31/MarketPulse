import { Worker } from "bullmq";
import { prisma } from "../prisma.js";
import { env } from "../config.js";
import { coingeckoProvider } from "../services/marketProvider.js";
import { cache } from "../services/cache.js";

const worker = new Worker(
  "price-fetch",
  async () => {
    console.log("[PriceWorker] Fetching top 100 crypto prices...");

    const coins = await coingeckoProvider.fetchTopAssets(100);

    for (const coin of coins) {
      const asset = await prisma.asset.upsert({
        where: { coingeckoId: coin.id },
        create: {
          coingeckoId: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: coin.image,
          type: "CRYPTO",
          currentPrice: coin.currentPrice,
          marketCap: coin.marketCap,
          volume24h: coin.volume24h,
          change24h: coin.change24h,
          rank: coin.rank,
        },
        update: {
          currentPrice: coin.currentPrice,
          marketCap: coin.marketCap,
          volume24h: coin.volume24h,
          change24h: coin.change24h,
          rank: coin.rank,
          image: coin.image,
        },
      });

      await prisma.assetSnapshot.create({
        data: {
          assetId: asset.id,
          price: coin.currentPrice,
          marketCap: coin.marketCap,
          volume: coin.volume24h,
          change24h: coin.change24h,
        },
      });
    }

    await cache.invalidatePattern("cache:top100:*");
    await cache.invalidatePattern("cache:asset:*");

    console.log(`[PriceWorker] Updated ${coins.length} assets`);
  },
  {
    connection: { url: env.REDIS_URL },
    autorun: true,
  }
);

worker.on("failed", (job, err) => {
  console.error(`[PriceWorker] Job ${job?.id} failed:`, err.message);
});

export default worker;
