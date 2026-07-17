import type { NextFunction, Request, Response } from "express";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { verifySessionToken } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const payload = verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, tokenVersion: true }
    });

    if (!user) return res.status(401).json({ error: "Invalid session" });
    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
