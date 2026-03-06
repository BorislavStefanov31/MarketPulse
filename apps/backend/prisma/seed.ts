import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.aIReport.deleteMany();
  await prisma.assetSnapshot.deleteMany();
  await prisma.watchlistAsset.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.asset.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      password: "hashed-later",
      name: "Test User",
    },
  });

  const assets = await Promise.all([
    prisma.asset.create({
      data: { symbol: "BTC", name: "Bitcoin", type: "CRYPTO", currentPrice: 97000, marketCap: 1900000000000, volume24h: 28000000000, change24h: 2.5, rank: 1 },
    }),
    prisma.asset.create({
      data: { symbol: "ETH", name: "Ethereum", type: "CRYPTO", currentPrice: 3400, marketCap: 410000000000, volume24h: 15000000000, change24h: -1.2, rank: 2 },
    }),
    prisma.asset.create({
      data: { symbol: "SOL", name: "Solana", type: "CRYPTO", currentPrice: 190, marketCap: 90000000000, volume24h: 3000000000, change24h: 5.1, rank: 3 },
    }),
    prisma.asset.create({
      data: { symbol: "XRP", name: "Ripple", type: "CRYPTO", currentPrice: 2.5, marketCap: 140000000000, volume24h: 5000000000, change24h: 0.8, rank: 4 },
    }),
    prisma.asset.create({
      data: { symbol: "ADA", name: "Cardano", type: "CRYPTO", currentPrice: 0.75, marketCap: 27000000000, volume24h: 800000000, change24h: -3.2, rank: 5 },
    }),
  ]);

  const watchlist = await prisma.watchlist.create({
    data: {
      name: "My Favorites",
      userId: user.id,
      assets: {
        create: [
          { assetId: assets[0]!.id, userId: user.id, sortOrder: 0 },
          { assetId: assets[1]!.id, userId: user.id, sortOrder: 1 },
          { assetId: assets[2]!.id, userId: user.id, sortOrder: 2 },
        ],
      },
    },
  });

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    await prisma.assetSnapshot.create({
      data: {
        assetId: assets[0]!.id,
        price: 97000 + Math.random() * 2000 - 1000,
        marketCap: 1900000000000,
        volume: 28000000000,
        timestamp: new Date(now.getTime() - i * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seed complete!");
  console.log(`  User: ${user.email}`);
  console.log(`  Assets: ${assets.length}`);
  console.log(`  Watchlist: ${watchlist.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());