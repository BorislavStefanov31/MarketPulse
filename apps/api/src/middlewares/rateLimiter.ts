import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../redis.js";

const store = (prefix: string) =>
  new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0], ...args.slice(1)) as Promise<number | string>,
    prefix,
  });

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: store("rl:global:"),
  message: { error: "Too many requests, please try again later" },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: store("rl:auth:"),
  message: { error: "Too many auth attempts, please try again later" },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: store("rl:ai:"),
  message: { error: "Too many AI requests, please try again later" },
});
