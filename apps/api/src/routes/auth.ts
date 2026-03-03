import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { env } from "../config.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { signupSchema, loginSchema, refreshSchema } from "../schemas/auth.js";

const router = Router();

router.post("/signup", validate(signupSchema), async (req, res) => {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ error: "Email already in use" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
    });

    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { userId: user.id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    await prisma.auditLog.create({
        data: { userId: user.id, action: "USER_SIGNUP", entity: "User", entityId: user.id },
    });

    res.status(201).json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
});

router.post("/login", validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { userId: user.id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    await prisma.auditLog.create({
        data: { userId: user.id, action: "USER_LOGIN", entity: "User", entityId: user.id },
    });

    res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
});

router.post("/refresh", validate(refreshSchema), async (req, res) => {
    const { refreshToken } = req.body;

    let payload;
    try {
        payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) {
        res.status(401).json({ error: "Refresh token not found" });
        return;
    }

    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
    }

    const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
    const newRefreshToken = jwt.sign(
        { userId: user.id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    await prisma.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

router.post("/logout", authenticate, async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken, userId: req.userId },
        });
    }

    await prisma.auditLog.create({
        data: { userId: req.userId, action: "USER_LOGOUT", entity: "User", entityId: req.userId },
    });

    res.json({ message: "Logged out" });
});

export default router;