import http from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import jwt from "jsonwebtoken";
import { env } from "./config.js";

const PORT = Number(process.env.SOCKET_PORT ?? 3001);

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" },
});

// Redis adapter so events published from the worker reach connected clients
const pubClient = new Redis(env.REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// JWT auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("No token"));

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as { userId: string };
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  // Join a personal room so we can target per-user events (e.g. alerts)
  const userId = socket.data.userId as string;
  socket.join(`user:${userId}`);
  console.log(`[Socket] ${userId} connected (${socket.id})`);

  socket.on("disconnect", () => {
    console.log(`[Socket] ${userId} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`[Socket] Server listening on port ${PORT}`);
});
