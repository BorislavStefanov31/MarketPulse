import { redis } from "../redis.js";

// Default TTLs in seconds
const TTL = {
  TOP100: 60,       // 60 seconds
  ASSET_DETAIL: 60, // 60 seconds
  AI_REPORT: 0,     // no TTL — invalidated manually when new report arrives
  ALERTS: 0,        // no TTL — invalidated on any alert change
};

// Keys
const keys = {
  top100: (query: string) => `cache:top100:${query}`,
  asset: (id: string) => `cache:asset:${id}`,
  aiReport: (assetId: string) => `cache:ai-report:${assetId}`,
  alerts: (userId: string) => `cache:alerts:${userId}`,
};

// Generic get/set
async function get<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

async function set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const json = JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(key, json, "EX", ttlSeconds);
  } else {
    await redis.set(key, json);
  }
}

async function invalidate(key: string): Promise<void> {
  await redis.del(key);
}

async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export const cache = {
  get,
  set,
  invalidate,
  invalidatePattern,
  keys,
  TTL,
};
