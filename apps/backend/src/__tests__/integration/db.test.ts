import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../../prisma.js";

describe("Database", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the database", async () => {
    const result = await prisma.$queryRawUnsafe<{ now: Date }[]>("SELECT NOW() as now");
    expect(result[0].now).toBeInstanceOf(Date);
  });

  it("has all expected tables", async () => {
    const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`
    );
    const tableNames = tables.map((t) => t.tablename).sort();

    expect(tableNames).toContain("User");
    expect(tableNames).toContain("Asset");
    expect(tableNames).toContain("Alert");
    expect(tableNames).toContain("AIReport");
    expect(tableNames).toContain("AuditLog");
    expect(tableNames).toContain("Watchlist");
    expect(tableNames).toContain("WatchlistAsset");
    expect(tableNames).toContain("AssetSnapshot");
    expect(tableNames).toContain("RefreshToken");
  });

  it("Asset model has coingeckoId field", async () => {
    const asset = await prisma.asset.create({
      data: {
        symbol: "TEST",
        coingeckoId: "test-coin",
        name: "Test Coin",
        type: "CRYPTO",
      },
    });

    expect(asset.coingeckoId).toBe("test-coin");

    await prisma.asset.delete({ where: { id: asset.id } });
  });

  it("enforces unique constraints", async () => {
    await prisma.asset.create({
      data: { symbol: "UNQ", name: "Unique", type: "CRYPTO" },
    });

    await expect(
      prisma.asset.create({
        data: { symbol: "UNQ", name: "Duplicate", type: "CRYPTO" },
      })
    ).rejects.toThrow();

    await prisma.asset.delete({ where: { symbol: "UNQ" } });
  });

  it("cascade deletes work (User -> Alert)", async () => {
    const user = await prisma.user.create({
      data: { email: "cascade@test.com", password: "hashed" },
    });
    const asset = await prisma.asset.create({
      data: { symbol: "CAS", name: "Cascade", type: "CRYPTO" },
    });
    await prisma.alert.create({
      data: { userId: user.id, assetId: asset.id, targetPrice: 100 },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const alerts = await prisma.alert.findMany({ where: { userId: user.id } });
    expect(alerts).toHaveLength(0);

    await prisma.asset.delete({ where: { id: asset.id } });
  });
});
