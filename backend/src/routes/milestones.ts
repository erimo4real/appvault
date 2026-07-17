import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeMilestone, serializeTask } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParam } from "../middleware/validate.js";
import { createNotification } from "./notifications.js";
import { getAppAccess } from "../lib/appAccess.js";

export const milestonesRouter = Router();

const createMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(180),
  dueDate: z.coerce.date().nullable().optional()
});

const updateMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  completed: z.boolean().optional()
});

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  timeMinutes: z.number().int().min(0).nullable().optional()
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  timeMinutes: z.number().int().min(0).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional()
});

milestonesRouter.use(requireAuth);

function getOwnedApp(appId: string, userId: string) {
  return getAppAccess(appId, userId).then((r) => (r && r.access === "owner" ? r.app : null));
}

function getWriteAccess(appId: string, userId: string) {
  return getAppAccess(appId, userId).then((r) =>
    r && (r.access === "owner" || r.access === "editor") ? r.app : null
  );
}

// --- Milestone routes ---

milestonesRouter.get("/apps/:appId/milestones", validateParam("appId"), async (req, res) => {
  const result = await getAppAccess(req.params.appId, req.user!.id);
  if (!result) return res.status(404).json({ error: "App not found" });

  const milestones = await prisma.milestone.findMany({
    where: { appId: result.app.id },
    include: { tasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }]
  });

  res.json({ milestones: milestones.map(serializeMilestone) });
});

milestonesRouter.post(
  "/apps/:appId/milestones",
  validateParam("appId"),
  validateBody(createMilestoneSchema),
  async (req, res) => {
    const app = await getWriteAccess(req.params.appId, req.user!.id);
    if (!app) return res.status(404).json({ error: "App not found" });

    const milestone = await prisma.milestone.create({
      data: {
        appId: app.id,
        title: req.body.title,
        dueDate: req.body.dueDate
      },
      include: { tasks: true }
    });

    await prisma.activityLog.create({
      data: {
        appId: app.id,
        userId: req.user!.id,
        action: "milestone_added",
        metadata: { title: milestone.title, dueDate: milestone.dueDate }
      }
    });

    res.status(201).json({ milestone: serializeMilestone(milestone) });
  }
);

milestonesRouter.patch(
  "/milestones/:id",
  validateParam("id"),
  validateBody(updateMilestoneSchema),
  async (req, res) => {
    const existing = await prisma.milestone.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { app: { userId: req.user!.id } },
          { app: { collaborators: { some: { userId: req.user!.id, role: "editor" } } } }
        ]
      },
      include: { app: true, tasks: true }
    });

    if (!existing) return res.status(404).json({ error: "Milestone not found" });

    const completing = req.body.completed === true && !existing.completed;
    const milestone = await prisma.milestone.update({
      where: { id: existing.id },
      data: {
        title: req.body.title,
        dueDate: req.body.dueDate,
        completed: req.body.completed,
        completedAt: completing ? new Date() : req.body.completed === false ? null : undefined
      },
      include: { tasks: { orderBy: { sortOrder: "asc" } } }
    });

    if (completing) {
      await prisma.activityLog.create({
        data: {
          appId: existing.appId,
          userId: req.user!.id,
          action: "milestone_completed",
          metadata: { title: milestone.title }
        }
      });
      await createNotification({
        userId: req.user!.id, appId: existing.appId,
        kind: "milestone_completed", title: "Milestone completed",
        body: `"${milestone.title}" is done.`
      });
    } else {
      await prisma.activityLog.create({
        data: {
          appId: existing.appId,
          userId: req.user!.id,
          action: "field_edited",
          metadata: { entity: "milestone", id: milestone.id }
        }
      });
    }

    res.json({ milestone: serializeMilestone(milestone) });
  }
);

milestonesRouter.delete("/milestones/:id", validateParam("id"), async (req, res) => {
  const existing = await prisma.milestone.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { app: { userId: req.user!.id } },
        { app: { collaborators: { some: { userId: req.user!.id, role: "editor" } } } }
      ]
    }
  });

  if (!existing) return res.status(404).json({ error: "Milestone not found" });
  await prisma.milestone.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// --- Task routes ---

  milestonesRouter.get("/milestones/:milestoneId/tasks", validateParam("milestoneId"), async (req, res) => {
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: req.params.milestoneId,
        OR: [
          { app: { userId: req.user!.id } },
          { app: { collaborators: { some: { userId: req.user!.id } } } }
        ]
      }
    });

    if (!milestone) return res.status(404).json({ error: "Milestone not found" });

    const tasks = await prisma.task.findMany({
      where: { milestoneId: milestone.id },
      orderBy: { sortOrder: "asc" }
    });

  res.json({ tasks: tasks.map(serializeTask) });
});

milestonesRouter.post(
  "/milestones/:milestoneId/tasks",
  validateParam("milestoneId"),
  validateBody(createTaskSchema),
  async (req, res) => {
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: req.params.milestoneId,
        OR: [
          { app: { userId: req.user!.id } },
          { app: { collaborators: { some: { userId: req.user!.id, role: "editor" } } } }
        ]
      },
      include: { app: true }
    });

    if (!milestone) return res.status(404).json({ error: "Milestone not found" });

    const maxOrder = await prisma.task.aggregate({
      where: { milestoneId: milestone.id },
      _max: { sortOrder: true }
    });
    const task = await prisma.task.create({
      data: {
        milestoneId: milestone.id,
        title: req.body.title,
        description: req.body.description ?? null,
        dueDate: req.body.dueDate,
        timeMinutes: req.body.timeMinutes,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
      }
    });

    await prisma.activityLog.create({
      data: {
        appId: milestone.appId,
        userId: req.user!.id,
        action: "task_added",
        metadata: { title: task.title, milestoneId: milestone.id }
      }
    });

    res.status(201).json({ task: serializeTask(task) });
  }
);

const reorderTasksSchema = z.object({
  orders: z.array(z.object({ id: z.string(), sortOrder: z.number().int().min(0) }))
});

milestonesRouter.post("/tasks/reorder", validateBody(reorderTasksSchema), async (req, res) => {
  const userId = req.user!.id;
  const ids = req.body.orders.map((o: { id: string }) => o.id);
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: ids },
      milestone: {
        OR: [
          { app: { userId } },
          { app: { collaborators: { some: { userId, role: "editor" } } } }
        ]
      }
    },
    select: { id: true }
  });
  const owned = new Set(tasks.map((t) => t.id));
  const updates = req.body.orders
    .filter((o: { id: string }) => owned.has(o.id))
    .map((o: { id: string; sortOrder: number }) =>
      prisma.task.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } })
    );
  await prisma.$transaction(updates);
  res.status(200).json({ ok: true });
});

milestonesRouter.patch(
  "/tasks/:id",
  validateParam("id"),
  validateBody(updateTaskSchema),
  async (req, res) => {
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        milestone: {
          OR: [
            { app: { userId: req.user!.id } },
            { app: { collaborators: { some: { userId: req.user!.id, role: "editor" } } } }
          ]
        }
      },
      include: { milestone: { include: { tasks: { orderBy: { sortOrder: "asc" } } } } }
    });

    if (!existing) return res.status(404).json({ error: "Task not found" });

    const becomingDone = req.body.status === "DONE" && existing.status !== "DONE";
    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        timeMinutes: req.body.timeMinutes,
        status: req.body.status,
        completedAt: becomingDone ? new Date() : req.body.status && req.body.status !== "DONE" ? null : undefined
      }
    });

    if (becomingDone) {
      await prisma.activityLog.create({
        data: {
          appId: existing.milestone.appId,
          userId: req.user!.id,
          action: "task_completed",
          metadata: { title: task.title, milestoneId: existing.milestoneId }
        }
      });
      await createNotification({
        userId: req.user!.id, appId: existing.milestone.appId,
        kind: "task_completed", title: "Task completed",
        body: `"${task.title}" is done.`
      });
    }

    // Auto-complete milestone when all tasks done
    const allTasks = existing.milestone.tasks ?? [];
    const allDone = allTasks.every((t) => t.status === "DONE" || t.id === task.id);
    if (allDone && !existing.milestone.completed) {
      await prisma.milestone.update({
        where: { id: existing.milestoneId },
        data: { completed: true, completedAt: new Date() }
      });
    }

    res.json({ task: serializeTask(task) });
  }
);

milestonesRouter.delete("/tasks/:id", validateParam("id"), async (req, res) => {
  const existing = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      milestone: {
        OR: [
          { app: { userId: req.user!.id } },
          { app: { collaborators: { some: { userId: req.user!.id, role: "editor" } } } }
        ]
      }
    }
  });

  if (!existing) return res.status(404).json({ error: "Task not found" });
  await prisma.task.delete({ where: { id: existing.id } });
  res.status(204).send();
});