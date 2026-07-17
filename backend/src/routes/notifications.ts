import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateParam } from "../middleware/validate.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/notifications", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const unread = await prisma.notification.count({
    where: { userId: req.user!.id, read: false }
  });
  res.json({ notifications, unread });
});

notificationsRouter.patch("/notifications/:id/read", validateParam("id"), async (req, res) => {
  const existing = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });
  if (!existing) return res.status(404).json({ error: "Notification not found" });
  await prisma.notification.update({ where: { id: existing.id }, data: { read: true } });
  res.json({ ok: true });
});

notificationsRouter.patch("/notifications/read-all", async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true }
  });
  res.json({ ok: true });
});

export async function createNotification(data: {
  userId: string;
  appId?: string;
  kind: string;
  title: string;
  body?: string;
}) {
  await prisma.notification.create({ data });
}