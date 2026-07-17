import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeApp, serializeMilestone, serializeTask } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";

export const searchRouter = Router();

searchRouter.get("/search", requireAuth, async (req, res) => {
  const q = (req.query.q as string ?? "").trim();
  if (!q) return res.json({ apps: [], tasks: [], vault: [] });

  const userId = req.user!.id;

  const [apps, tasks, vault] = await Promise.all([
    prisma.app.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { clientName: { contains: q, mode: "insensitive" } },
          { stack: { hasSome: [q] } }
        ]
      },
      include: {
        milestones: { include: { tasks: { orderBy: { sortOrder: "asc" } } } }
      },
      take: 10
    }),
    prisma.task.findMany({
      where: {
        milestone: { app: { userId } },
        title: { contains: q, mode: "insensitive" }
      },
      include: {
        milestone: {
          include: { app: { select: { id: true, name: true } } }
        }
      },
      take: 10
    }),
    prisma.vaultEntry.findMany({
      where: {
        userId,
        OR: [
          { label: { contains: q, mode: "insensitive" } },
          { provider: { contains: q, mode: "insensitive" } }
        ]
      },
      include: {
        app: { select: { id: true, name: true } }
      },
      take: 10
    })
  ]);

  res.json({
    apps: apps.map(serializeApp),
    tasks: tasks.map((t) => ({
      ...serializeTask(t),
      appName: t.milestone.app.name,
      appId: t.milestone.app.id
    })),
    vault: vault.map((v) => ({
      id: v.id,
      label: v.label,
      provider: v.provider,
      category: v.category,
      appId: v.app.id,
      appName: v.app.name
    }))
  });
});