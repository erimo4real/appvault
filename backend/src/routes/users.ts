import { Router } from "express";
import { z } from "zod";
import { clearAuthCookie } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { serializeUser } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParam } from "../middleware/validate.js";
import { isCloudinaryConfigured, getCloudinary } from "../lib/cloudinary.js";

export const usersRouter = Router();

const avatarUrlSchema = z
  .string()
  .max(500)
  .refine(
    (value) => value.startsWith("https://") || value === "",
    "Avatar must be an HTTPS URL or empty string"
  );

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  avatarUrl: avatarUrlSchema.nullable().optional()
});

usersRouter.use(requireAuth);

usersRouter.get("/me", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ user: serializeUser(user) });
});

usersRouter.get("/:id/profile", validateParam("id"), async (req, res) => {
  if (req.params.id !== req.user!.id) {
    return res.status(403).json({ error: "You can only view your own profile" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ user: serializeUser(user) });
});

usersRouter.patch("/me", validateBody(updateProfileSchema), async (req, res) => {
  if (req.body.email) {
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing && existing.id !== req.user!.id) {
      return res.status(409).json({ error: "Email is already in use" });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: req.body.name,
      email: req.body.email,
      avatarUrl: req.body.avatarUrl === "" ? null : req.body.avatarUrl
    }
  });

  res.json({ user: serializeUser(user) });
});

usersRouter.delete("/me", async (req, res) => {
  if (isCloudinaryConfigured()) {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (user?.avatarUrl?.startsWith("https://res.cloudinary.com")) {
      const cloudinary = getCloudinary()!;
      await cloudinary.uploader.destroy("avatars/" + req.user!.id).catch(() => {});
    }
  }
  await prisma.user.delete({ where: { id: req.user!.id } });
  clearAuthCookie(res);
  res.status(204).send();
});
