import express from "express";
import cors from "cors";
import helmet from "helmet";
import { httpLogger } from "./logger.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);
app.use(globalLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// API routes
import routes from "./routes/index.js";
app.use("/api/v1", routes);

export default app;
