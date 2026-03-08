import dotenv from "dotenv";
import { z } from "zod";
import { existsSync } from "node:fs";
import path from "node:path";

const envTestPath = path.resolve(import.meta.dirname, "../.env.test");
const rootEnvPath = path.resolve(import.meta.dirname, "../../../.env");
dotenv.config({ path: existsSync(envTestPath) ? envTestPath : rootEnvPath });

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/marketpulse"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  OPENAI_API_KEY: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM_EMAIL: z.string().default("noreply@marketpulse.app"),
});
export const env = envSchema.parse(process.env);
