import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

const csrfCookieName = "appvault_csrf";
const unsafeMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const exemptPaths = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/oauth",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/logout"
]);

export function issueCsrfToken(_req: Request, res: Response) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(csrfCookieName, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
  });
  res.json({ csrfToken: token });
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method) || exemptPaths.has(req.path)) {
    return next();
  }

  const cookieToken = req.cookies?.[csrfCookieName];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
}
