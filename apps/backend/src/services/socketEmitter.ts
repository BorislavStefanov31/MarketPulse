import { Emitter } from "@socket.io/redis-emitter";
import { Redis } from "ioredis";
import { env } from "../config.js";

const redisClient = new Redis(env.REDIS_URL);
export const emitter = new Emitter(redisClient);
