import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateUUID } from "../middlewares/validateUUID.js";
import { createAlertSchema, updateAlertSchema } from "../schemas/alerts.js";
import { cache } from "../services/cache.js";
import { shouldTriggerAlert } from "../services/alertHelpers.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const cacheKey = cache.keys.alerts(req.userId!);

  const cached = await cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: req.userId },
    include: { asset: true },
    orderBy: { createdAt: "desc" },
  });

  await cache.set(cacheKey, alerts);
  res.json(alerts);
});

router.get("/triggered", async (req, res) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.userId, isActive: true, isTriggered: false },
    include: { asset: true },
  });

  const newlyTriggered = [];

  for (const alert of alerts) {
    if (shouldTriggerAlert({ isActive: alert.isActive, isTriggered: alert.isTriggered, type: alert.type, targetPrice: alert.targetPrice, currentPrice: alert.asset.currentPrice })) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { isTriggered: true, triggeredAt: new Date() },
      });
      newlyTriggered.push({ ...alert, isTriggered: true, triggeredAt: new Date() });
    }
  }

  if (newlyTriggered.length > 0) {
    await cache.invalidate(cache.keys.alerts(req.userId!));
  }

  res.json(newlyTriggered);
});

router.post("/", validate(createAlertSchema), async (req, res) => {
  const count = await prisma.alert.count({ where: { userId: req.userId } });
  if (count >= 10) {
    res.status(400).json({ error: "Maximum 10 alerts allowed" });
    return;
  }

  const alert = await prisma.alert.create({
    data: {
      userId: req.userId!,
      assetId: req.body.assetId,
      type: req.body.type,
      targetPrice: req.body.targetPrice,
    },
    include: { asset: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.userId,
      action: "ALERT_CREATED",
      entity: "Alert",
      entityId: alert.id,
      metadata: { assetId: req.body.assetId, targetPrice: req.body.targetPrice },
    },
  });

  await cache.invalidate(cache.keys.alerts(req.userId!));

  res.status(201).json(alert);
});

router.patch("/:id", validateUUID("id"), validate(updateAlertSchema), async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id as string },
  });

  if (!alert || alert.userId !== req.userId) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const updated = await prisma.alert.update({
    where: { id: req.params.id as string },
    data: { isActive: req.body.isActive },
    include: { asset: true },
  });

  await cache.invalidate(cache.keys.alerts(req.userId!));

  res.json(updated);
});

router.delete("/:id", validateUUID("id"), async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id as string },
  });

  if (!alert || alert.userId !== req.userId) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  await prisma.alert.delete({ where: { id: req.params.id as string } });

  await prisma.auditLog.create({
    data: { userId: req.userId, action: "ALERT_DELETED", entity: "Alert", entityId: req.params.id as string },
  });

  await cache.invalidate(cache.keys.alerts(req.userId!));

  res.json({ message: "Alert deleted" });
});

export default router;
