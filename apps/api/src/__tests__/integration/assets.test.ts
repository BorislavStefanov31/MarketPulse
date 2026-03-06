import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../prisma.js";
import { cleanAll, cleanRedis, disconnectAll } from "./setup.js";

let accessToken: string;

async function createUserAndLogin() {
  const res = await request(app)
    .post("/api/v1/auth/signup")
    .send({ email: "assets@test.com", password: "password123", name: "Assets" });
  return res.body.accessToken;
}

async function seedAssets(count: number) {
  for (let i = 1; i <= count; i++) {
    await prisma.asset.create({
      data: {
        symbol: `COIN${i}`,
        coingeckoId: `coin-${i}`,
        name: `Coin ${i}`,
        type: "CRYPTO",
        currentPrice: 1000 - i,
        marketCap: (count - i + 1) * 1000000000,
        rank: i,
      },
    });
  }
}

describe("Assets API", () => {
  beforeAll(async () => {
    await cleanAll();
    accessToken = await createUserAndLogin();
  });

  afterAll(async () => {
    await cleanAll();
    await disconnectAll();
  });

  beforeEach(async () => {
    await cleanRedis();
    await prisma.assetSnapshot.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.aIReport.deleteMany();
    await prisma.watchlistAsset.deleteMany();
    await prisma.asset.deleteMany();
  });

  describe("GET /api/v1/assets/top100", () => {
    it("returns paginated assets", async () => {
      await seedAssets(15);

      const res = await request(app)
        .get("/api/v1/assets/top100?limit=10")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.hasNext).toBe(true);
      expect(res.body.nextCursor).toBeDefined();
    });

    it("returns second page with cursor", async () => {
      await seedAssets(15);

      const page1 = await request(app)
        .get("/api/v1/assets/top100?limit=10")
        .set("Authorization", `Bearer ${accessToken}`);

      const page2 = await request(app)
        .get(`/api/v1/assets/top100?limit=10&cursor=${page1.body.nextCursor}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(page2.status).toBe(200);
      expect(page2.body.data).toHaveLength(5);
      expect(page2.body.hasNext).toBe(false);
      expect(page2.body.nextCursor).toBeNull();
    });

    it("returns empty when no assets", async () => {
      const res = await request(app)
        .get("/api/v1/assets/top100")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.hasNext).toBe(false);
    });

    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/assets/top100");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/assets/:id", () => {
    it("returns asset detail", async () => {
      await seedAssets(1);
      const asset = await prisma.asset.findFirst();

      const res = await request(app)
        .get(`/api/v1/assets/${asset!.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe("COIN1");
      expect(res.body.name).toBe("Coin 1");
    });

    it("returns 404 for non-existent asset", async () => {
      const res = await request(app)
        .get("/api/v1/assets/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
