import type { NextFunction, Request, Response } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Evict expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function rateLimit(options: { windowMs: number; max: number; keyPrefix: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      return res.status(429).json({ error: "Too many requests. Try again later." });
    }

    next();
  };
}

export const globalLimiter = rateLimit({ keyPrefix: "global", windowMs: 60 * 1000, max: 150 });
export const uploadLimiter = rateLimit({ keyPrefix: "upload", windowMs: 60 * 1000, max: 20 });
export const shareLimiter = rateLimit({ keyPrefix: "share", windowMs: 60 * 1000, max: 30 });
export const publicShareLimiter = rateLimit({ keyPrefix: "public-share", windowMs: 60 * 1000, max: 10 });
