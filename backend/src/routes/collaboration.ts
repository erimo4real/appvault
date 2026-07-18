import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParam } from "../middleware/validate.js";
import { getAppAccess } from "../lib/appAccess.js";
import { createNotification } from "./notifications.js";

export const collaborationRouter = Router();
collaborationRouter.use(requireAuth);

const inviteSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(["editor", "viewer"]).default("editor")
});

collaborationRouter.post("/apps/:appId/invite", validateParam("appId"), validateBody(inviteSchema), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result || result.access !== "owner") {
    return res.status(403).json({ error: "Only the app owner can invite collaborators" });
  }
  if (result.app.userId === req.user!.id && req.body.email === req.user!.email) {
    return res.status(400).json({ error: "You cannot invite yourself" });
  }
  const existing = await prisma.invitation.findFirst({
    where: { appId: result.app.id, invitedEmail: req.body.email, status: "pending" }
  });
  if (existing) return res.status(409).json({ error: "Invitation already pending for this email" });
  const existingCollab = await prisma.collaborator.findFirst({
    where: { appId: result.app.id, user: { email: req.body.email } }
  });
  if (existingCollab) return res.status(409).json({ error: "User is already a collaborator" });
  const invitedUser = await prisma.user.findUnique({ where: { email: req.body.email } });
  const invitation = await prisma.invitation.create({
    data: {
      appId: result.app.id,
      invitedById: req.user!.id,
      invitedEmail: req.body.email,
      role: req.body.role
    }
  });
  if (invitedUser) {
    await createNotification({
      userId: invitedUser.id, appId: result.app.id,
      kind: "collaborator_added", title: "Collaboration invite",
      body: `You've been invited to "${result.app.name}"`
    });
  }
  res.status(201).json({ invitation });
});

collaborationRouter.get("/invitations", async (req, res) => {
  const invitations = await prisma.invitation.findMany({
    where: { invitedEmail: req.user!.email, status: "pending" },
    include: { app: { select: { id: true, name: true } }, invitedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json({ invitations });
});

collaborationRouter.patch("/invitations/:id/accept", validateParam("id"), async (req, res) => {
  const invitation = await prisma.invitation.findFirst({
    where: { id: req.params.id, invitedEmail: req.user!.email, status: "pending" }
  });
  if (!invitation) return res.status(404).json({ error: "Invitation not found" });
  const existingCollab = await prisma.collaborator.findUnique({
    where: { userId_appId: { userId: req.user!.id, appId: invitation.appId } }
  });
  if (existingCollab) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "accepted" } });
    return res.json({ ok: true });
  }
  await prisma.$transaction([
    prisma.collaborator.create({ data: { userId: req.user!.id, appId: invitation.appId, role: invitation.role } }),
    prisma.invitation.update({ where: { id: invitation.id }, data: { status: "accepted" } })
  ]);
  res.json({ ok: true });
});

collaborationRouter.patch("/invitations/:id/reject", validateParam("id"), async (req, res) => {
  const invitation = await prisma.invitation.findFirst({
    where: { id: req.params.id, invitedEmail: req.user!.email, status: "pending" }
  });
  if (!invitation) return res.status(404).json({ error: "Invitation not found" });
  await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "rejected" } });
  res.json({ ok: true });
});

collaborationRouter.get("/apps/:appId/collaborators", validateParam("appId"), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result) return res.status(404).json({ error: "App not found" });
  const collaborators = await prisma.collaborator.findMany({
    where: { appId: result.app.id },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
  });
  res.json({ collaborators });
});

collaborationRouter.delete("/apps/:appId/collaborators/:userId", validateParam("appId"), validateParam("userId"), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result || result.access !== "owner") {
    return res.status(403).json({ error: "Only the owner can remove collaborators" });
  }
  const collab = await prisma.collaborator.findUnique({
    where: { userId_appId: { userId: req.params.userId, appId: result.app.id } }
  });
  if (!collab) return res.status(404).json({ error: "Collaborator not found" });
  await prisma.collaborator.delete({ where: { id: collab.id } });
  res.json({ ok: true });
});