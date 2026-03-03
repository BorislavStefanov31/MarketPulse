import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    const token = authorization.split(" ")[1];

    try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; role: string };
        req.userId = payload.userId;
        req.userRole = payload.role;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};