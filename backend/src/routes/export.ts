import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeApp } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";

export const exportRouter = Router();

exportRouter.get("/export/:format", requireAuth, async (req, res) => {
  const format = req.params.format;
  if (format !== "csv" && format !== "json") {
    return res.status(400).json({ error: "Format must be 'csv' or 'json'" });
  }

  const userId = req.user!.id;

  const apps = await prisma.app.findMany({
    where: { userId },
    include: {
      milestones: {
        include: { tasks: { orderBy: { sortOrder: "asc" } } }
      },
      vaultEntries: {
        select: { id: true, provider: true, category: true, label: true, publicUrl: true, username: true, notes: true, expiresAt: true }
      },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 500 }
    },
    orderBy: { createdAt: "desc" }
  });

  if (format === "json") {
    res.setHeader("Content-Disposition", "attachment; filename=appvault-export.json");
    res.setHeader("Content-Type", "application/json");
    return res.json({ exportedAt: new Date().toISOString(), apps });
  }

  const rows: string[] = [];
  rows.push("app_name,app_type,status,milestone,task,task_due,task_completed,vault_label,vault_provider,vault_category,activity");
  for (const app of apps) {
    const milestones = app.milestones.length > 0 ? app.milestones : [{ title: "", tasks: [] as typeof app.milestones[0]["tasks"] }];
    for (const ms of milestones) {
      const tasks = ms.tasks.length > 0 ? ms.tasks : [{ title: "", dueDate: null, status: "TODO" as const }];
      for (const task of tasks) {
        const vault = app.vaultEntries.length > 0 ? app.vaultEntries : [{ label: "", provider: "", category: "" } as const];
        for (const ve of vault) {
          const activity = app.activityLogs.length > 0
            ? app.activityLogs.map((a) => a.action).join("; ")
            : "";
          const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
          rows.push([
            escape(app.name), escape(app.type), escape(app.status),
            escape(ms.title), escape(task.title),
            task.dueDate ? escape(task.dueDate.toISOString().slice(0, 10)) : "",
            task.status === "DONE" ? "yes" : "no",
            escape(ve.label), escape(ve.provider), escape(String(ve.category)),
            escape(activity)
          ].join(","));
        }
      }
    }
  }

  res.setHeader("Content-Disposition", "attachment; filename=appvault-export.csv");
  res.setHeader("Content-Type", "text/csv");
  res.send(rows.join("\n"));
});