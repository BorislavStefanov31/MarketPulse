import { Router } from "express";
import authRoutes from "./auth.js";
import usersRoutes from "./users.js";
import assetsRoutes from "./assets.js";
import watchlistsRoutes from "./watchlists.js";
import alertsRoutes from "./alerts.js";
import aiRoutes from "./ai.js";
import auditLogRoutes from "./auditLog.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/assets", assetsRoutes);
router.use("/watchlists", watchlistsRoutes);
router.use("/alerts", alertsRoutes);
router.use("/ai", aiRoutes);
router.use("/audit-log", auditLogRoutes);

export default router;
