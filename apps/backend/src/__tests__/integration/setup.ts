import { prisma } from "../../prisma.js";
import { redis } from "../../redis.js";

export async function cleanDb() {
  await prisma.auditLog.deleteMany();
  await prisma.aIReport.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.watchlistAsset.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.assetSnapshot.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
}

export async function cleanRedis() {
  await redis.flushdb();
}

export async function cleanAll() {
  await cleanDb();
  await cleanRedis();
}

export async function disconnectAll() {
  await prisma.$disconnect();
  redis.disconnect();
}
