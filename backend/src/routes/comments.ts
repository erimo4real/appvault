import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeComment } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParam } from "../middleware/validate.js";

export const commentsRouter = Router();

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000)
});

commentsRouter.use(requireAuth);

commentsRouter.get("/tasks/:taskId/comments", validateParam("taskId"), async (req, res) => {
  const task = await prisma.task.findFirst({
    where: {
      id: req.params.taskId,
      OR: [
        { milestone: { app: { userId: req.user!.id } } },
        { milestone: { app: { collaborators: { some: { userId: req.user!.id } } } } }
      ]
    }
  });
  if (!task) return res.status(404).json({ error: "Task not found" });

  const comments = await prisma.comment.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: "asc" }
  });

  res.json({ comments: comments.map(serializeComment) });
});

commentsRouter.post(
  "/tasks/:taskId/comments",
  validateParam("taskId"),
  validateBody(createCommentSchema),
  async (req, res) => {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.taskId,
        OR: [
          { milestone: { app: { userId: req.user!.id } } },
          { milestone: { app: { collaborators: { some: { userId: req.user!.id } } } } }
        ]
      },
      include: { milestone: { include: { app: true } } }
    });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const comment = await prisma.comment.create({
      data: {
        taskId: task.id,
        userId: req.user!.id,
        content: req.body.content
      }
    });

    res.status(201).json({ comment: serializeComment(comment) });
  }
);

commentsRouter.delete("/comments/:id", validateParam("id"), async (req, res) => {
  const existing = await prisma.comment.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });
  if (!existing) return res.status(404).json({ error: "Comment not found" });
  await prisma.comment.delete({ where: { id: existing.id } });
  res.status(204).send();
});