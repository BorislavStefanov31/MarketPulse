import dotenv from "dotenv";
import { z } from "zod";
import { existsSync } from "node:fs";
import path from "node:path";

// Load .env.test if it exists (created by testcontainers), otherwise load .env
const envTestPath = path.resolve(import.meta.dirname, "../.env.test");
dotenv.config({ path: existsSync(envTestPath) ? envTestPath : undefined });

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
});
export const env = envSchema.parse(process.env);
