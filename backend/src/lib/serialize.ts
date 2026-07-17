import type { ActivityLog, App, Comment, Milestone, Task, User } from "@prisma/client";

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString()
  };
}

export function serializeComment(comment: Comment) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString()
  };
}

export function serializeTask(task: Task) {
  return {
    id: task.id,
    milestoneId: task.milestoneId,
    title: task.title,
    description: task.description ?? null,
    dueDate: task.dueDate?.toISOString() ?? null,
    timeMinutes: task.timeMinutes,
    sortOrder: task.sortOrder,
    status: task.status,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString()
  };
}

export function serializeMilestone(
  milestone: Milestone & { tasks?: Task[] }
) {
  return {
    id: milestone.id,
    appId: milestone.appId,
    title: milestone.title,
    dueDate: milestone.dueDate?.toISOString() ?? null,
    completed: milestone.completed,
    completedAt: milestone.completedAt?.toISOString() ?? null,
    autoCreated: milestone.autoCreated,
    createdAt: milestone.createdAt.toISOString(),
    tasks: milestone.tasks?.map(serializeTask)
  };
}

export function serializeActivity(entry: ActivityLog) {
  return {
    id: entry.id,
    appId: entry.appId,
    userId: entry.userId,
    action: entry.action,
    metadata: entry.metadata as Record<string, unknown>,
    createdAt: entry.createdAt.toISOString()
  };
}

type MilestoneWithTasks = Milestone & { tasks?: Task[] };

export function progressFromMilestones(milestones: MilestoneWithTasks[]) {
  if (milestones.length === 0) return 0;
  const allTasks = milestones.flatMap((m) => m.tasks ?? []);
  if (allTasks.length === 0) return 0;
  const completed = allTasks.filter((t) => t.status === "DONE").length;
  return Math.round((completed / allTasks.length) * 100);
}

export function nextDueDateFromMilestones(milestones: MilestoneWithTasks[]) {
  const next = milestones
    .filter((m) => !m.completed && m.dueDate)
    .sort((a, b) => Number(a.dueDate) - Number(b.dueDate))[0];

  return next?.dueDate?.toISOString() ?? null;
}

export function serializeApp(
  app: App & { milestones?: MilestoneWithTasks[]; activityLogs?: ActivityLog[] }
) {
  const milestones = app.milestones ?? [];

  return {
    id: app.id,
    userId: app.userId,
    name: app.name,
    description: app.description,
    type: app.type,
    status: app.status,
    stack: app.stack,
    repoUrl: app.repoUrl,
    liveUrl: app.liveUrl,
    clientName: app.clientName,
    monthlyCost: app.monthlyCost ? Number(app.monthlyCost) : null,
    renewalDate: app.renewalDate?.toISOString() ?? null,
    notes: app.notes,
    archivedAt: app.archivedAt?.toISOString() ?? null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    milestones: app.milestones?.map(serializeMilestone),
    activity: app.activityLogs?.map(serializeActivity),
    progress: progressFromMilestones(milestones),
    nextDueDate: nextDueDateFromMilestones(milestones)
  };
}
