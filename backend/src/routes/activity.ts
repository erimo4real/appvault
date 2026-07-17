import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeActivity } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";
import { validateParam } from "../middleware/validate.js";

export const activityRouter = Router();

activityRouter.use(requireAuth);

activityRouter.get("/apps/:id/activity", validateParam("id"), async (req, res) => {
  const app = await prisma.app.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { userId: req.user!.id },
        { collaborators: { some: { userId: req.user!.id } } }
      ]
    }
  });
  if (!app) return res.status(404).json({ error: "App not found" });

  const activity = await prisma.activityLog.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: "desc" }
  });

  res.json({ activity: activity.map(serializeActivity) });
});
