import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const cursor = req.query.cursor as string | undefined;

  const logs = await prisma.auditLog.findMany({
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const hasNext = logs.length > limit;
  if (hasNext) logs.pop();

  const nextCursor = hasNext ? logs[logs.length - 1].id : null;

  res.json({ data: logs, nextCursor, hasNext });
});

export default router;