import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/dashboard", async (req, res) => {
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);

  const apps = await prisma.app.findMany({
    where: {
      OR: [
        { userId: req.user!.id },
        { collaborators: { some: { userId: req.user!.id } } }
      ],
      archivedAt: null, status: { not: "archived" }
    },
    include: { milestones: true }
  });

  const overdueMilestones = apps.flatMap((app) =>
    app.milestones
      .filter((milestone) => milestone.dueDate && milestone.dueDate < now && !milestone.completed)
      .map((milestone) => ({
        id: milestone.id,
        appId: app.id,
        appName: app.name,
        kind: "overdue_milestone" as const,
        message: `${milestone.title} is overdue`,
        dueDate: milestone.dueDate!.toISOString()
      }))
  );

  const renewals = apps
    .filter((app) => app.renewalDate && app.renewalDate >= now && app.renewalDate <= sevenDays)
    .map((app) => ({
      id: `renewal-${app.id}`,
      appId: app.id,
      appName: app.name,
      kind: "renewal" as const,
      message: `${app.name} renews within 7 days`,
      dueDate: app.renewalDate!.toISOString()
    }));

  res.json({
    metrics: {
      totalApps: apps.length,
      liveApps: apps.filter((app) => app.status === "live").length,
      monthlySpend: apps.reduce((sum, app) => sum + Number(app.monthlyCost ?? 0), 0),
      overdueTasks: overdueMilestones.length
    },
    alerts: [...overdueMilestones, ...renewals].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
  });
});
