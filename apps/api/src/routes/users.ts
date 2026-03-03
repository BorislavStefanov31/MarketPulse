import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateProfileSchema } from "../schemas/users.js";

const router = Router();

router.use(authenticate);

router.get("/me", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      currency: true,
      locale: true,
      theme: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.patch("/me", validate(updateProfileSchema), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: req.body,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      currency: true,
      locale: true,
      theme: true,
      createdAt: true,
    },
  });

  res.json(user);
});

export default router;
