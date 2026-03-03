import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get("/top100", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor as string | undefined;
  const sort = (req.query.sort as string) || "rank";
  const order = (req.query.order as string) || "asc";
  const type = req.query.type as string | undefined;
  const sector = req.query.sector as string | undefined;
  const exchange = req.query.exchange as string | undefined;

  const allowedSorts = ["rank", "marketCap", "volume24h", "change24h", "currentPrice"];
  const sortField = allowedSorts.includes(sort) ? sort : "rank";
  const sortOrder = order === "desc" ? "desc" : "asc";

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (sector) where.sector = sector;
  if (exchange) where.exchange = exchange;

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

  res.json({
    data: assets,
    nextCursor,
    hasNext,
  });
});

router.get("/:id", async (req, res) => {
  const asset = await prisma.asset.findUnique({
    where: { id: req.params.id as string },
  });

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.json(asset);
});

router.get("/:id/history", async (req, res) => {
  const days = Math.min(Number(req.query.days) || 7, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snapshots = await prisma.assetSnapshot.findMany({
    where: {
      assetId: req.params.id as string,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: "asc" },
  });

  res.json(snapshots);
});

export default router;
