export type AppType = "personal" | "client" | "saas";
export type AppStatus = "idea" | "building" | "live" | "archived";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type ActivityAction =
  | "app_created"
  | "status_changed"
  | "milestone_added"
  | "milestone_completed"
  | "task_added"
  | "task_completed"
  | "field_edited"
  | "app_archived";

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface TaskDto {
  id: string;
  milestoneId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  timeMinutes: number | null;
  sortOrder: number;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
}

export interface MilestoneDto {
  id: string;
  appId: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  autoCreated: boolean;
  createdAt: string;
  tasks?: TaskDto[];
}

export interface ActivityLogDto {
  id: string;
  appId: string;
  userId: string;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CommentDto {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export type VaultCategory =
  | "database"
  | "hosting"
  | "auth"
  | "storage"
  | "email"
  | "payment"
  | "analytics"
  | "domain"
  | "repository"
  | "other";

export interface VaultEntryDto {
  id: string;
  appId: string;
  userId: string;
  provider: string;
  category: VaultCategory;
  label: string;
  publicUrl: string | null;
  dashboardUrl: string | null;
  username: string | null;
  hasSecret: boolean;
  secret?: string | null;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: AppType;
  status: AppStatus;
  stack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  clientName: string | null;
  monthlyCost: number | null;
  renewalDate: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  milestones?: MilestoneDto[];
  activity?: ActivityLogDto[];
  progress?: number;
  nextDueDate?: string | null;
}

export interface DashboardMetrics {
  totalApps: number;
  liveApps: number;
  monthlySpend: number;
  overdueTasks: number;
}

export interface DashboardAlert {
  id: string;
  appId: string;
  appName: string;
  kind: "overdue_milestone" | "renewal";
  message: string;
  dueDate: string;
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  alerts: DashboardAlert[];
}

export interface AttachmentDto {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  appId: string | null;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationDto[];
  unread: number;
}

export interface InvitationDto {
  id: string;
  appId: string;
  invitedById: string;
  invitedEmail: string;
  status: string;
  createdAt: string;
  app?: { id: string; name: string };
  invitedBy?: { id: string; name: string | null; email: string };
}

export interface CollaboratorDto {
  id: string;
  userId: string;
  appId: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
}

export interface ShareLinkDto {
  id: string;
  appId: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface SearchResultDto {
  apps: AppDto[];
  tasks: (TaskDto & { appName: string; appId: string })[];
  vault: {
    id: string;
    label: string;
    provider: string;
    category: VaultCategory;
    appId: string;
    appName: string;
  }[];
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
