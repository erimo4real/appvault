import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "./env.js";

const sevenDaysSeconds = 60 * 60 * 24 * 7;

export interface JwtPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export function signSessionToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: sevenDaysSeconds });
}

export function verifySessionToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function setAuthCookie(res: Response, token: string, rememberMe?: boolean) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    ...(rememberMe !== false ? { maxAge: sevenDaysSeconds * 1000 } : {})
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
  });
}
