import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createWatchlistSchema, addAssetSchema } from "../schemas/watchlists.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const watchlists = await prisma.watchlist.findMany({
    where: { userId: req.userId },
    include: {
      assets: {
        include: { asset: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(watchlists);
});

router.post("/", validate(createWatchlistSchema), async (req, res) => {
  const watchlist = await prisma.watchlist.create({
    data: {
      name: req.body.name,
      userId: req.userId!,
    },
  });

  await prisma.auditLog.create({
    data: { userId: req.userId, action: "WATCHLIST_CREATED", entity: "Watchlist", entityId: watchlist.id },
  });

  res.status(201).json(watchlist);
});

router.patch("/:id", validate(createWatchlistSchema), async (req, res) => {
  const watchlist = await prisma.watchlist.findUnique({
    where: { id: req.params.id as string },
  });

  if (!watchlist || watchlist.userId !== req.userId) {
    res.status(404).json({ error: "Watchlist not found" });
    return;
  }

  const updated = await prisma.watchlist.update({
    where: { id: req.params.id as string },
    data: { name: req.body.name },
  });

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const watchlist = await prisma.watchlist.findUnique({
    where: { id: req.params.id as string },
  });

  if (!watchlist || watchlist.userId !== req.userId) {
    res.status(404).json({ error: "Watchlist not found" });
    return;
  }

  await prisma.watchlist.delete({ where: { id: req.params.id as string } });

  await prisma.auditLog.create({
    data: { userId: req.userId, action: "WATCHLIST_DELETED", entity: "Watchlist", entityId: req.params.id as string },
  });

  res.json({ message: "Watchlist deleted" });
});

router.post("/:id/assets", validate(addAssetSchema), async (req, res) => {
  const watchlist = await prisma.watchlist.findUnique({
    where: { id: req.params.id as string },
  });

  if (!watchlist || watchlist.userId !== req.userId) {
    res.status(404).json({ error: "Watchlist not found" });
    return;
  }

  const count = await prisma.watchlistAsset.count({
    where: { watchlistId: req.params.id as string },
  });

  const watchlistAsset = await prisma.watchlistAsset.create({
    data: {
      watchlistId: req.params.id as string,
      assetId: req.body.assetId,
      userId: req.userId,
      sortOrder: count,
    },
    include: { asset: true },
  });

  res.status(201).json(watchlistAsset);
});

router.delete("/:id/assets/:assetId", async (req, res) => {
  const watchlist = await prisma.watchlist.findUnique({
    where: { id: req.params.id as string },
  });

  if (!watchlist || watchlist.userId !== req.userId) {
    res.status(404).json({ error: "Watchlist not found" });
    return;
  }

  await prisma.watchlistAsset.deleteMany({
    where: {
      watchlistId: req.params.id as string,
      assetId: req.params.assetId as string,
    },
  });

  res.json({ message: "Asset removed from watchlist" });
});

export default router;
