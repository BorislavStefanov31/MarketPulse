import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createAlertSchema } from "../schemas/alerts.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.userId },
    include: { asset: true },
    orderBy: { createdAt: "desc" },
  });

  for (const alert of alerts) {
    if (alert.isActive && !alert.isTriggered && alert.asset.currentPrice) {
      if (alert.asset.currentPrice >= alert.targetPrice) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: { isTriggered: true, triggeredAt: new Date() },
        });
        alert.isTriggered = true;
        alert.triggeredAt = new Date();
      }
    }
  }

  res.json(alerts);
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

  res.status(201).json(alert);
});

router.patch("/:id", async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id as string },
  });

  if (!alert || alert.userId !== req.userId) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const updated = await prisma.alert.update({
    where: { id: req.params.id as string },
    data: { isActive: !alert.isActive },
    include: { asset: true },
  });

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
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

  res.json({ message: "Alert deleted" });
});

export default router;