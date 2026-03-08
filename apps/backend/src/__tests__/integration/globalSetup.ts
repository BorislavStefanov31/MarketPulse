import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer } from "@testcontainers/redis";
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";

const ENV_FILE = path.resolve(import.meta.dirname, "../../../.env.test");

export default async function setup() {
  const [pg, rd] = await Promise.all([
    new PostgreSqlContainer("postgres:16")
      .withDatabase("marketpulse_test")
      .withUsername("postgres")
      .withPassword("postgres")
      .start(),
    new RedisContainer("redis:7").start(),
  ]);

  const databaseUrl = pg.getConnectionUri();
  const redisUrl = rd.getConnectionUrl();

  writeFileSync(
    ENV_FILE,
    [
      `DATABASE_URL=${databaseUrl}`,
      `REDIS_URL=${redisUrl}`,
      `NODE_ENV=test`,
      `JWT_ACCESS_SECRET=test-access-secret`,
      `JWT_REFRESH_SECRET=test-refresh-secret`,
      `OPENAI_API_KEY=test-key`,
    ].join("\n")
  );

  const schemaPath = path.resolve(import.meta.dirname, "../../../prisma/schema.prisma");
  execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });

  console.log(`\nTestcontainers started:`);
  console.log(`  Postgres: ${databaseUrl}`);
  console.log(`  Redis: ${redisUrl}\n`);

  return async () => {
    try { unlinkSync(ENV_FILE); } catch {}
    await Promise.all([pg.stop(), rd.stop()]);
  };
}
