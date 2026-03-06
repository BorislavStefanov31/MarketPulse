import express from "express";
import helmet from "helmet";
import { httpLogger } from "./logger.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(httpLogger);
app.use(globalLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Metrics
app.get("/metrics", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    },
    pid: process.pid,
    nodeVersion: process.version,
  });
});

// API routes
import routes from "./routes/index.js";
app.use("/api/v1", routes);

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;
