import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./config.js";
import { randomUUID } from "node:crypto";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  ...(env.NODE_ENV === "development" && {
    transport: { target: "pino-pretty" },
  }),
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    return (req.headers["x-request-id"] as string) || randomUUID();
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customProps: (req) => ({
    correlationId: req.id,
  }),
});
