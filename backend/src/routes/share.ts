import { randomBytes } from "crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeApp, serializeMilestone } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";
import { validateParam } from "../middleware/validate.js";
import { publicShareLimiter, shareLimiter } from "../middleware/rateLimit.js";
import { getAppAccess } from "../lib/appAccess.js";

export const shareRouter = Router();

const TOKEN_BYTES = 32;

shareRouter.post("/apps/:appId/share-links", requireAuth, shareLimiter, validateParam("appId"), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result || result.access !== "owner") {
    return res.status(403).json({ error: "Only the app owner can create share links" });
  }
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const link = await prisma.shareLink.create({
    data: { appId: result.app.id, token }
  });
  res.status(201).json({ shareLink: link });
});

shareRouter.delete("/apps/:appId/share-links/:id", requireAuth, shareLimiter, validateParam("appId"), validateParam("id"), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result || result.access !== "owner") {
    return res.status(403).json({ error: "Only the app owner can delete share links" });
  }
  const existing = await prisma.shareLink.findFirst({
    where: { id: req.params.id, appId: result.app.id }
  });
  if (!existing) return res.status(404).json({ error: "Share link not found" });
  await prisma.shareLink.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

shareRouter.get("/apps/:appId/share-links", requireAuth, validateParam("appId"), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result || result.access !== "owner") {
    return res.status(403).json({ error: "Only the app owner can view share links" });
  }
  const links = await prisma.shareLink.findMany({
    where: { appId: result.app.id },
    orderBy: { createdAt: "desc" }
  });
  res.json({ shareLinks: links });
});

shareRouter.get("/share/:token", publicShareLimiter, async (req, res) => {
  const link = await prisma.shareLink.findUnique({
    where: { token: req.params.token },
    include: {
      app: {
        include: {
          milestones: {
            include: { tasks: { orderBy: { sortOrder: "asc" } } },
            orderBy: [{ completed: "asc" }, { dueDate: "asc" }]
          }
        }
      }
    }
  });
  if (!link) return res.status(404).json({ error: "Share link not found" });
  if (link.expiresAt && link.expiresAt < new Date()) {
    return res.status(410).json({ error: "Share link has expired" });
  }
  res.json({ app: serializeApp(link.app) });
});