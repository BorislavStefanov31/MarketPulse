import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";
import { env } from "../config.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { randomBytes } from "node:crypto";
import { signupSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.js";
import { sendPasswordResetEmail } from "../services/email.js";

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
        { userId: user.id, jti: randomUUID() },
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
        { userId: user.id, jti: randomUUID() },
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
        { userId: user.id, jti: randomUUID() },
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

router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res) => {
    const { email } = req.body;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.json({ message: "If that email exists, a reset link has been sent" });
        return;
    }

    // Invalidate any existing reset tokens for this user
    await prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
        data: { userId: user.id, token, expiresAt },
    });

    await sendPasswordResetEmail(email, token);

    await prisma.auditLog.create({
        data: { userId: user.id, action: "PASSWORD_RESET_REQUESTED", entity: "User", entityId: user.id },
    });

    res.json({ message: "If that email exists, a reset link has been sent" });
});

router.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
    const { token, password } = req.body;

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
        res.status(400).json({ error: "Invalid or expired reset token" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: resetRecord.userId },
            data: { password: hashedPassword },
        }),
        prisma.passwordReset.update({
            where: { id: resetRecord.id },
            data: { usedAt: new Date() },
        }),
        // Revoke all refresh tokens on password change
        prisma.refreshToken.deleteMany({
            where: { userId: resetRecord.userId },
        }),
    ]);

    await prisma.auditLog.create({
        data: { userId: resetRecord.userId, action: "PASSWORD_RESET_COMPLETED", entity: "User", entityId: resetRecord.userId },
    });

    res.json({ message: "Password has been reset" });
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