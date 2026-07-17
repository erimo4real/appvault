import { prisma } from "./prisma.js";

export async function getAppAccess(appId: string, userId: string) {
  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return null;
  if (app.userId === userId) return { app, access: "owner" as const };
  const collab = await prisma.collaborator.findUnique({
    where: { userId_appId: { userId, appId } }
  });
  if (!collab) return null;
  return { app, access: collab.role as "editor" | "viewer" };
}