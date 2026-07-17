import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeApp } from "../lib/serialize.js";
import { getAppAccess } from "../lib/appAccess.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParam } from "../middleware/validate.js";

export const appsRouter = Router();

const appBaseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  type: z.enum(["personal", "client", "saas"]),
  status: z.enum(["idea", "building", "live", "archived"]).optional(),
  stack: z.array(z.string().trim().min(1).max(40)).max(25).default([]),
  repoUrl: z.string().url().nullable().optional().or(z.literal("")),
  liveUrl: z.string().url().nullable().optional().or(z.literal("")),
  clientName: z.string().trim().max(160).nullable().optional(),
  monthlyCost: z.coerce.number().min(0).max(999999).nullable().optional(),
  renewalDate: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional()
});

const createAppSchema = appBaseSchema;
const updateAppSchema = appBaseSchema.partial();

function normalizeUrl(value: string | null | undefined) {
  return value === "" ? null : value;
}

async function getOwnedApp(appId: string, userId: string) {
  return prisma.app.findFirst({ where: { id: appId, userId } });
}

appsRouter.use(requireAuth);

const validateId = validateParam("id");

appsRouter.get("/", async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const apps = await prisma.app.findMany({
    where: {
      OR: [
        { userId: req.user!.id },
        { collaborators: { some: { userId: req.user!.id } } }
      ],
      ...(includeArchived ? {} : { archivedAt: null, status: { not: "archived" } }),
      ...(type && ["personal", "client", "saas"].includes(type) ? { type: type as never } : {})
    },
    include: { milestones: { include: { tasks: true } } },
    orderBy: { updatedAt: "desc" }
  });

  res.json({ apps: apps.map(serializeApp) });
});

appsRouter.post("/", validateBody(createAppSchema), async (req, res) => {
  const app = await prisma.app.create({
    data: {
      userId: req.user!.id,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      status: req.body.status ?? "idea",
      stack: req.body.stack,
      repoUrl: normalizeUrl(req.body.repoUrl),
      liveUrl: normalizeUrl(req.body.liveUrl),
      clientName: req.body.clientName,
      monthlyCost:
        req.body.monthlyCost === null || req.body.monthlyCost === undefined
          ? null
          : new Prisma.Decimal(req.body.monthlyCost),
      renewalDate: req.body.renewalDate,
      notes: req.body.notes,
      milestones: {
        create: {
          title: "Tasks",
          autoCreated: true
        }
      },
      activityLogs: {
        create: {
          userId: req.user!.id,
          action: "app_created",
          metadata: { name: req.body.name }
        }
      }
    },
    include: { milestones: { include: { tasks: true } }, activityLogs: { orderBy: { createdAt: "desc" } } }
  });

  res.status(201).json({ app: serializeApp(app) });
});

appsRouter.get("/:id", validateId, async (req, res) => {
  const app = await prisma.app.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { userId: req.user!.id },
        { collaborators: { some: { userId: req.user!.id } } }
      ]
    },
    include: {
      milestones: { include: { tasks: true }, orderBy: [{ completed: "asc" }, { dueDate: "asc" }] },
      activityLogs: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!app) return res.status(404).json({ error: "App not found" });
  res.json({ app: serializeApp(app) });
});

appsRouter.patch("/:id", validateId, validateBody(updateAppSchema), async (req, res) => {
  const existing = await getOwnedApp(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: "App not found" });

  const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
  for (const [field, newValue] of Object.entries(req.body)) {
    const oldValue = (existing as unknown as Record<string, unknown>)[field];
    if (String(oldValue ?? "") !== String(newValue ?? "")) {
      changes.push({ field, oldValue, newValue });
    }
  }
  const activityWrites = changes.map((change) => ({
    userId: req.user!.id,
    action: change.field === "status" ? ("status_changed" as const) : ("field_edited" as const),
    metadata: change
  }));

  const app = await prisma.app.update({
    where: { id: existing.id },
    data: {
      ...req.body,
      repoUrl: normalizeUrl(req.body.repoUrl),
      liveUrl: normalizeUrl(req.body.liveUrl),
      monthlyCost:
        req.body.monthlyCost === undefined
          ? undefined
          : req.body.monthlyCost === null
            ? null
            : new Prisma.Decimal(req.body.monthlyCost),
      archivedAt:
        req.body.status === "archived" && !existing.archivedAt
          ? new Date()
          : req.body.status && req.body.status !== "archived"
            ? null
            : undefined,
      activityLogs: activityWrites.length ? { create: activityWrites } : undefined
    },
    include: {
      milestones: { include: { tasks: true }, orderBy: [{ completed: "asc" }, { dueDate: "asc" }] },
      activityLogs: { orderBy: { createdAt: "desc" } }
    }
  });

  res.json({ app: serializeApp(app) });
});

appsRouter.delete("/:id", validateId, async (req, res) => {
  const existing = await getOwnedApp(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: "App not found" });

  const app = await prisma.app.update({
    where: { id: existing.id },
    data: {
      status: "archived",
      archivedAt: existing.archivedAt ?? new Date(),
      activityLogs: {
        create: {
          userId: req.user!.id,
          action: "app_archived",
          metadata: { name: existing.name }
        }
      }
    },
    include: { milestones: { include: { tasks: true } }, activityLogs: { orderBy: { createdAt: "desc" } } }
  });

  res.json({ app: serializeApp(app) });
});

appsRouter.post("/:id/restore", validateId, async (req, res) => {
  const existing = await getOwnedApp(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: "App not found" });

  const app = await prisma.app.update({
    where: { id: existing.id },
    data: {
      status: existing.status === "archived" ? "building" : existing.status,
      archivedAt: null,
      activityLogs: {
        create: {
          userId: req.user!.id,
          action: "field_edited",
          metadata: { field: "archivedAt", oldValue: existing.archivedAt, newValue: null }
        }
      }
    },
    include: { milestones: { include: { tasks: true } }, activityLogs: { orderBy: { createdAt: "desc" } } }
  });

  res.json({ app: serializeApp(app) });
});

appsRouter.delete("/:id/permanent", validateId, async (req, res) => {
  const existing = await getOwnedApp(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: "App not found" });

  await prisma.app.delete({ where: { id: existing.id } });
  res.status(204).send();
});
