import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { cleanAll, disconnectAll } from "./setup.js";

describe("Auth API", () => {
  beforeAll(async () => {
    await cleanAll();
  });

  afterAll(async () => {
    await cleanAll();
    await disconnectAll();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  describe("POST /api/v1/auth/signup", () => {
    it("creates a new user and returns tokens", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "test@test.com", password: "Password123", name: "Test" });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe("test@test.com");
      expect(res.body.user.name).toBe("Test");
      expect(res.body.user.role).toBe("USER");
    });

    it("returns 409 for duplicate email", async () => {
      await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "dupe@test.com", password: "Password123", name: "First" });

      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "dupe@test.com", password: "Password123", name: "Second" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already in use");
    });

    it("returns 400 for invalid body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "login@test.com", password: "Password123", name: "Login" });
    });

    it("returns tokens for valid credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login@test.com", password: "Password123" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("returns 401 for wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login@test.com", password: "wrong" });

      expect(res.status).toBe(401);
    });

    it("returns 401 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nobody@test.com", password: "Password123" });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("rotates tokens", async () => {
      const signup = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "refresh@test.com", password: "Password123", name: "Refresh" });

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: signup.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(signup.body.refreshToken);
    });

    it("invalidates old refresh token after use", async () => {
      const signup = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "refresh2@test.com", password: "Password123", name: "Refresh2" });

      await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: signup.body.refreshToken });

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: signup.body.refreshToken });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("logs out successfully", async () => {
      const signup = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "logout@test.com", password: "Password123", name: "Logout" });

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${signup.body.accessToken}`)
        .send({ refreshToken: signup.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged out");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/logout")
        .send({});

      expect(res.status).toBe(401);
    });
  });
});
