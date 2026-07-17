import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { clearAuthCookie, setAuthCookie, signSessionToken } from "../lib/auth.js";
import { serializeUser } from "../lib/serialize.js";
import { env } from "../lib/env.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validate.js";

export const authRouter = Router();

const passwordSchema = z.string().min(8).max(128)
  .refine((v) => /[A-Z]/.test(v), "Password must contain an uppercase letter")
  .refine((v) => /[a-z]/.test(v), "Password must contain a lowercase letter")
  .refine((v) => /[0-9]/.test(v), "Password must contain a number");

const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: passwordSchema,
  name: z.string().trim().min(1).max(120).optional()
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

const oauthSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().optional(),
  provider: z.enum(["google"]),
  providerId: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.string().email().trim().toLowerCase()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema
});

const authLimiter = rateLimit({ keyPrefix: "auth", windowMs: 15 * 60 * 1000, max: 25 });
const resetLimiter = rateLimit({ keyPrefix: "password-reset", windowMs: 15 * 60 * 1000, max: 8 });

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

authRouter.post("/register", authLimiter, validateBody(registerSchema), async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) return res.status(409).json({ error: "Email is already registered" });

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.name,
      passwordHash,
      authProvider: "password"
    }
  });

  setAuthCookie(res, signSessionToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion }));
  res.status(201).json({ user: serializeUser(user) });
});

authRouter.post("/login", authLimiter, validateBody(loginSchema), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user?.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  setAuthCookie(res, signSessionToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion }), req.body.rememberMe);
  res.json({ user: serializeUser(user) });
});

authRouter.post("/oauth", authLimiter, validateBody(oauthSchema), async (req, res) => {
  const user = await prisma.user.upsert({
    where: { email: req.body.email },
    create: {
      email: req.body.email,
      name: req.body.name,
      avatarUrl: req.body.avatarUrl,
      authProvider: req.body.provider,
      providerId: req.body.providerId
    },
    update: {
      name: req.body.name,
      avatarUrl: req.body.avatarUrl,
      authProvider: req.body.provider,
      providerId: req.body.providerId
    }
  });

  setAuthCookie(res, signSessionToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion }));
  res.json({ user: serializeUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ user: serializeUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

authRouter.post("/forgot-password", resetLimiter, validateBody(forgotPasswordSchema), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user) {
    return res.json({ message: "If that email exists, a password reset link has been created." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt
    }
  });

  res.json({
    message: "If that email exists, a password reset link has been created.",
    ...(env.NODE_ENV !== "production" ? { resetToken: token } : {})
  });
});

authRouter.post("/reset-password", resetLimiter, validateBody(resetPasswordSchema), async (req, res) => {
  const tokenHash = hashToken(req.body.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, authProvider: "password", tokenVersion: { increment: 1 } }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  clearAuthCookie(res);
  res.json({ message: "Password reset successful" });
});

authRouter.post("/change-password", requireAuth, validateBody(changePasswordSchema), async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!user.passwordHash) {
    return res.status(400).json({ error: "No password set for this account" });
  }

  const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, tokenVersion: { increment: 1 } }
  });

  clearAuthCookie(res);
  res.json({ message: "Password changed. Please log in again." });
});
