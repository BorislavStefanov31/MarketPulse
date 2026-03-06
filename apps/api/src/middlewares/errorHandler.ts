import { Request, Response, NextFunction } from "express";
import { logger } from "../logger.js";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    err,
    correlationId: req.id,
    method: req.method,
    url: req.url,
  });

  res.status(500).json({
    error: "Internal server error",
    correlationId: req.id,
  });
};
