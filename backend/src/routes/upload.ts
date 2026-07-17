import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Router } from "express";
import multer from "multer";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { getAppAccess } from "../lib/appAccess.js";
import { requireAuth } from "../middleware/auth.js";
import { validateParam } from "../middleware/validate.js";
import { uploadLimiter } from "../middleware/rateLimit.js";
import { isCloudinaryConfigured, getCloudinary } from "../lib/cloudinary.js";
import { serializeUser } from "../lib/serialize.js";

const ALLOWED_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf", "text/plain", "text/csv",
  "application/json", "application/vnd.ms-excel",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function extFromName(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

const ALLOWED_EXTS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf", ".txt", ".csv", ".json", ".xls", ".xlsx",
  ".doc", ".docx"
]);

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export const uploadRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const LOCAL_DIR = join(import.meta.dirname, "..", "..", "uploads");

function isR2Configured() {
  return !!(env.R2_ENDPOINT && env.R2_ACCESS_KEY && env.R2_SECRET_KEY && env.R2_BUCKET);
}

function getS3() {
  if (!isR2Configured()) return null;
  return new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT!,
    credentials: { accessKeyId: env.R2_ACCESS_KEY!, secretAccessKey: env.R2_SECRET_KEY! }
  });
}

function storageKeyPrefix() {
  return isR2Configured() ? "" : "local:";
}

function resolveStoragePath(storageKey: string) {
  if (storageKey.startsWith("local:")) {
    return join(LOCAL_DIR, storageKey.slice(6));
  }
  return null;
}

uploadRouter.use(requireAuth);

async function assertTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { milestone: { app: { userId } } },
        { milestone: { app: { collaborators: { some: { userId } } } } }
      ]
    }
  });
  return task;
}

uploadRouter.get("/tasks/:taskId/attachments", validateParam("taskId"), async (req, res) => {
  const task = await assertTaskAccess(req.params.taskId, req.user!.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const attachments = await prisma.attachment.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: "desc" }
  });

  res.json({ attachments: attachments.map((a) => serializeAttachment(a)) });
});

uploadRouter.post("/tasks/:taskId/attachments", uploadLimiter, validateParam("taskId"), upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file provided" });

  if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTS.has(extFromName(file.originalname))) {
    return res.status(400).json({ error: "File type not allowed" });
  }

  const task = await assertTaskAccess(req.params.taskId, req.user!.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const cleanName = sanitizeName(file.originalname);
  const prefix = storageKeyPrefix();
  const keyPath = `${req.user!.id}/${task.id}/${Date.now()}-${cleanName}`;
  const storageKey = `${prefix}${keyPath}`;

  if (isR2Configured()) {
    const s3 = getS3()!;
    await s3.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: keyPath,
      Body: file.buffer,
      ContentType: file.mimetype
    }));
  } else {
    const filePath = join(LOCAL_DIR, keyPath);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.buffer);
  }

  const attachment = await prisma.attachment.create({
    data: {
      taskId: task.id,
      userId: req.user!.id,
      fileName: cleanName,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageKey
    }
  });

  res.status(201).json({ attachment: serializeAttachment(attachment) });
});

uploadRouter.get("/attachments/:id/file", validateParam("id"), async (req, res) => {
  const att = await prisma.attachment.findUnique({ where: { id: req.params.id } });
  if (!att) return res.status(404).json({ error: "Attachment not found" });

  const task = await assertTaskAccess(att.taskId, req.user!.id);
  if (!task) return res.status(403).json({ error: "Access denied" });

  if (isR2Configured() && !att.storageKey.startsWith("local:")) {
    const s3 = getS3()!;
    const obj = await s3.send(new GetObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: att.storageKey
    }));
    res.setHeader("Content-Type", att.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${att.fileName}"`);
    (obj.Body as NodeJS.ReadableStream).pipe(res);
  } else {
    const filePath = resolveStoragePath(att.storageKey);
    if (!filePath) return res.status(404).json({ error: "File not found" });
    const data = await readFile(filePath);
    res.setHeader("Content-Type", att.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${att.fileName}"`);
    res.send(data);
  }
});

uploadRouter.delete("/attachments/:id", validateParam("id"), async (req, res) => {
  const existing = await prisma.attachment.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });
  if (!existing) return res.status(404).json({ error: "Attachment not found" });

  if (isR2Configured() && !existing.storageKey.startsWith("local:")) {
    const s3 = getS3()!;
    await s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET!, Key: existing.storageKey }));
  } else {
    const filePath = resolveStoragePath(existing.storageKey);
    if (filePath) await unlink(filePath).catch(() => {});
  }

  await prisma.attachment.delete({ where: { id: existing.id } });
  res.status(204).send();
});

const AVATAR_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

uploadRouter.post("/upload/avatar", uploadLimiter, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file provided" });

  if (!AVATAR_MIMES.has(file.mimetype)) {
    return res.status(400).json({ error: "Use a PNG, JPG, or WEBP image." });
  }

  if (file.size > 1_500_000) {
    return res.status(400).json({ error: "Use an image smaller than 1.5 MB." });
  }

  if (!isCloudinaryConfigured()) {
    return res.status(500).json({ error: "Cloudinary is not configured." });
  }

  const cloudinary = getCloudinary()!;
  const b64 = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: req.user!.id,
    folder: "avatars",
    overwrite: true,
    invalidate: true
  });

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatarUrl: result.secure_url }
  });

  res.json({ user: serializeUser(user) });
});

function serializeAttachment(a: { id: string; taskId: string; userId: string; fileName: string; fileSize: number; mimeType: string; storageKey: string; createdAt: Date }) {
  return {
    id: a.id,
    taskId: a.taskId,
    userId: a.userId,
    fileName: a.fileName,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
    storageKey: a.storageKey,
    createdAt: a.createdAt.toISOString()
  };
}