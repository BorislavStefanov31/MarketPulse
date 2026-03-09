import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../prisma.js";
import { cleanAll, disconnectAll } from "./setup.js";

let accessToken: string;
let assetId: string;

describe("Alerts API", () => {
  beforeAll(async () => {
    await cleanAll();

    const signup = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "alerts@test.com", password: "Password123", name: "Alerts" });

    accessToken = signup.body.accessToken;

    const asset = await prisma.asset.create({
      data: {
        symbol: "BTC",
        coingeckoId: "bitcoin",
        name: "Bitcoin",
        type: "CRYPTO",
        currentPrice: 95000,
        rank: 1,
      },
    });
    assetId = asset.id;
  });

  afterAll(async () => {
    await cleanAll();
    await disconnectAll();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.alert.deleteMany();
  });

  describe("POST /api/v1/alerts", () => {
    it("creates an alert", async () => {
      const res = await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ assetId, type: "ABOVE", targetPrice: 100000 });

      expect(res.status).toBe(201);
      expect(res.body.targetPrice).toBe(100000);
      expect(res.body.isActive).toBe(true);
      expect(res.body.isTriggered).toBe(false);
    });

    it("enforces 10 alert limit", async () => {
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post("/api/v1/alerts")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ assetId, type: "ABOVE", targetPrice: 100000 + i });
      }

      const res = await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ assetId, type: "ABOVE", targetPrice: 200000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Maximum 10 alerts allowed");
    });
  });

  describe("GET /api/v1/alerts", () => {
    it("returns user alerts", async () => {
      await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ assetId, type: "ABOVE", targetPrice: 100000 });

      const res = await request(app)
        .get("/api/v1/alerts")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].asset).toBeDefined();
    });
  });

  describe("GET /api/v1/alerts/triggered", () => {
    it("triggers alert when price meets target", async () => {
      await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ assetId, type: "ABOVE", targetPrice: 90000 });

      const res = await request(app)
        .get("/api/v1/alerts/triggered")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].isTriggered).toBe(true);
    });

    it("returns empty when no alerts are triggered", async () => {
      await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ assetId, type: "ABOVE", targetPrice: 200000 });

      const res = await request(app)
        .get("/api/v1/alerts/triggered")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe("DELETE /api/v1/alerts/:id", () => {
    it("deletes an alert", async () => {
      const created = await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ assetId, type: "ABOVE", targetPrice: 100000 });

      const res = await request(app)
        .delete(`/api/v1/alerts/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Alert deleted");
    });
  });
});
