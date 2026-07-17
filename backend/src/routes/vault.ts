import { Router } from "express";
import { z } from "zod";
import { encryptSecret } from "../lib/crypto.js";
import { prisma } from "../lib/prisma.js";
import { serializeVaultEntry } from "../lib/vault.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParam } from "../middleware/validate.js";
import { getAppAccess } from "../lib/appAccess.js";

export const vaultRouter = Router();

const urlField = z.string().url().nullable().optional().or(z.literal(""));

const vaultSchema = z.object({
  provider: z.string().trim().min(1).max(80),
  category: z.enum([
    "database",
    "hosting",
    "auth",
    "storage",
    "email",
    "payment",
    "analytics",
    "domain",
    "repository",
    "other"
  ]),
  label: z.string().trim().min(1).max(140),
  publicUrl: urlField,
  dashboardUrl: urlField,
  username: z.string().trim().max(180).nullable().optional(),
  secret: z.string().max(5000).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional()
});

const updateVaultSchema = vaultSchema.partial();

vaultRouter.use(requireAuth);

function cleanUrl(value: string | null | undefined) {
  return value === "" ? null : value;
}

async function getOwnedApp(appId: string, userId: string) {
  return prisma.app.findFirst({ where: { id: appId, userId } });
}

async function getOwnedEntry(entryId: string, userId: string) {
  return prisma.vaultEntry.findFirst({ where: { id: entryId, userId } });
}

vaultRouter.get("/apps/:appId/vault", validateParam("appId"), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result) return res.status(404).json({ error: "App not found" });

  const reveal = req.query.reveal === "true" && result.access === "owner";
  const entries = await prisma.vaultEntry.findMany({
    where: { appId: result.app.id, userId: result.app.userId },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }]
  });

  if (reveal && entries.length > 0) {
    await prisma.activityLog.create({
      data: {
        appId: result.app.id,
        userId: req.user!.id,
        action: "field_edited",
        metadata: { entity: "vault", action: "secrets_revealed", count: entries.length }
      }
    });
  }

  res.json({ entries: entries.map((entry) => serializeVaultEntry(entry, reveal)) });
});

vaultRouter.post("/apps/:appId/vault", validateParam("appId"), validateBody(vaultSchema), async (req, res) => {
  const app = await getOwnedApp(req.params.appId, req.user!.id);
  if (!app) return res.status(404).json({ error: "App not found" });

  const entry = await prisma.vaultEntry.create({
    data: {
      appId: app.id,
      userId: req.user!.id,
      provider: req.body.provider,
      category: req.body.category,
      label: req.body.label,
      publicUrl: cleanUrl(req.body.publicUrl),
      dashboardUrl: cleanUrl(req.body.dashboardUrl),
      username: req.body.username,
      secretEncrypted: encryptSecret(req.body.secret),
      notes: req.body.notes,
      expiresAt: req.body.expiresAt
    }
  });

  await prisma.activityLog.create({
    data: {
      appId: app.id,
      userId: req.user!.id,
      action: "field_edited",
      metadata: { entity: "vault", action: "created", label: entry.label, provider: entry.provider }
    }
  });

  res.status(201).json({ entry: serializeVaultEntry(entry) });
});

vaultRouter.patch("/vault/:id", validateParam("id"), validateBody(updateVaultSchema), async (req, res) => {
  const existing = await getOwnedEntry(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: "Vault entry not found" });

  const entry = await prisma.vaultEntry.update({
    where: { id: existing.id },
    data: {
      provider: req.body.provider,
      category: req.body.category,
      label: req.body.label,
      publicUrl: cleanUrl(req.body.publicUrl),
      dashboardUrl: cleanUrl(req.body.dashboardUrl),
      username: req.body.username,
      secretEncrypted:
        req.body.secret === undefined
          ? undefined
          : req.body.secret === null || req.body.secret === ""
            ? null
            : encryptSecret(req.body.secret),
      notes: req.body.notes,
      expiresAt: req.body.expiresAt
    }
  });

  await prisma.activityLog.create({
    data: {
      appId: entry.appId,
      userId: req.user!.id,
      action: "field_edited",
      metadata: { entity: "vault", action: "updated", label: entry.label, provider: entry.provider }
    }
  });

  res.json({ entry: serializeVaultEntry(entry) });
});

vaultRouter.delete("/vault/:id", validateParam("id"), async (req, res) => {
  const existing = await getOwnedEntry(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: "Vault entry not found" });

  await prisma.vaultEntry.delete({ where: { id: existing.id } });
  await prisma.activityLog.create({
    data: {
      appId: existing.appId,
      userId: req.user!.id,
      action: "field_edited",
      metadata: { entity: "vault", action: "deleted", label: existing.label, provider: existing.provider }
    }
  });

  res.status(204).send();
});
