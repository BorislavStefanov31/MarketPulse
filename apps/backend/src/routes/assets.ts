import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { validateUUID } from "../middlewares/validateUUID.js";
import { cache } from "../services/cache.js";

const router = Router();

router.use(authenticate);

const ALLOWED_SORTS = ["rank", "marketCap", "volume24h", "change24h", "currentPrice"] as const;
const ALLOWED_TYPES = ["CRYPTO", "STOCK", "ETF", "COMMODITY"] as const;

router.get("/top100", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const sort = String(req.query.sort || "rank");
  const order = String(req.query.order || "asc");
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const sortField = ALLOWED_SORTS.includes(sort as typeof ALLOWED_SORTS[number]) ? sort : "rank";
  const sortOrder = order === "desc" ? "desc" : "asc";
  if (type && !ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
    res.status(400).json({ error: "Invalid type filter" });
    return;
  }

  // Cache key based on query params
  const queryKey = `${limit}:${cursor || ""}:${sortField}:${sortOrder}:${type || ""}`;
  const cacheKey = cache.keys.top100(queryKey);

  const cached = await cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const assets = await prisma.asset.findMany({
    where,
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { [sortField]: sortOrder },
  });

  const hasNext = assets.length > limit;
  if (hasNext) assets.pop();

  const nextCursor = hasNext ? assets[assets.length - 1].id : null;

  const result = { data: assets, nextCursor, hasNext };

  await cache.set(cacheKey, result, cache.TTL.TOP100);

  res.json(result);
});

router.get("/:id", validateUUID("id"), async (req, res) => {
  const id = req.params.id as string;
  const cacheKey = cache.keys.asset(id);

  const cached = await cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const asset = await prisma.asset.findUnique({ where: { id } });

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  await cache.set(cacheKey, asset, cache.TTL.ASSET_DETAIL);

  res.json(asset);
});

router.get("/:id/history", validateUUID("id"), async (req, res) => {
  const days = Math.min(Number(req.query.days) || 7, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snapshots = await prisma.assetSnapshot.findMany({
    where: {
      assetId: req.params.id as string,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: "asc" },
    take: 100,
  });

  res.json(snapshots);
});

export default router;
