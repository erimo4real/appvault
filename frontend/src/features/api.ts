import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type {
  ActivityLogDto,
  AppDto,
  AttachmentDto,
  CollaboratorDto,
  CommentDto,
  DashboardResponse,
  InvitationDto,
  MilestoneDto,
  NotificationsResponse,
  SearchResultDto,
  ShareLinkDto,
  TaskDto,
  UserDto,
  VaultEntryDto
} from "@appvault/shared";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include"
});

let csrfToken: string | null = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  const response = await fetch(`${baseUrl}/api/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not load CSRF token");
  const data = (await response.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

const mutatingMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

const baseQueryWithCsrf: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const method = typeof args === "string" ? "GET" : (args.method ?? "GET").toUpperCase();
  let requestArgs = args;

  if (mutatingMethods.has(method)) {
    const token = await getCsrfToken();
    if (typeof args !== "string") {
      requestArgs = {
        ...args,
        headers: {
          ...(args.headers as Record<string, string> | undefined),
          "x-csrf-token": token
        }
      };
    }
  }

  return rawBaseQuery(requestArgs, api, extraOptions);
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithCsrf,
  tagTypes: ["Auth", "User", "Apps", "App", "Dashboard", "Milestones", "Activity", "Vault", "Comments", "Search", "Attachments", "Notifications"],
  endpoints: (builder) => ({
    me: builder.query<{ user: UserDto }, void>({
      query: () => "/api/auth/me",
      providesTags: ["Auth"]
    }),
    register: builder.mutation<{ user: UserDto }, { email: string; password: string; name: string }>({
      query: (body) => ({ url: "/api/auth/register", method: "POST", body }),
      invalidatesTags: ["Auth"]
    }),
    login: builder.mutation<{ user: UserDto }, { email: string; password: string; rememberMe?: boolean }>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
      invalidatesTags: ["Auth"]
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/api/auth/logout", method: "POST" }),
      invalidatesTags: ["Auth", "Apps", "Dashboard"]
    }),
    forgotPassword: builder.mutation<{ message: string; resetToken?: string }, { email: string }>({
      query: (body) => ({ url: "/api/auth/forgot-password", method: "POST", body })
    }),
    resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({
      query: (body) => ({ url: "/api/auth/reset-password", method: "POST", body })
    }),
    userProfile: builder.query<{ user: UserDto }, string | void>({
      query: (id) => (id ? `/api/users/${id}/profile` : "/api/users/me"),
      providesTags: ["User"]
    }),
    updateUserProfile: builder.mutation<
      { user: UserDto },
      { name?: string; email?: string; avatarUrl?: string | null }
    >({
      query: (body) => ({ url: "/api/users/me", method: "PATCH", body }),
      invalidatesTags: ["Auth", "User"]
    }),
    deleteUserProfile: builder.mutation<void, void>({
      query: () => ({ url: "/api/users/me", method: "DELETE" }),
      invalidatesTags: ["Auth", "User", "Apps", "Dashboard"]
    }),
    uploadAvatar: builder.mutation<{ user: UserDto }, File>({
      query: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return { url: "/api/upload/avatar", method: "POST", body: fd };
      },
      invalidatesTags: ["User"]
    }),
    dashboard: builder.query<DashboardResponse, void>({
      query: () => "/api/dashboard",
      providesTags: ["Dashboard"]
    }),
    apps: builder.query<{ apps: AppDto[] }, { includeArchived?: boolean; type?: string } | void>({
      query: (params) => ({
        url: "/api/apps",
        params: {
          includeArchived: params?.includeArchived,
          type: params?.type
        }
      }),
      providesTags: ["Apps"]
    }),
    app: builder.query<{ app: AppDto }, string>({
      query: (id) => `/api/apps/${id}`,
      providesTags: (_result, _error, id) => [{ type: "App", id }]
    }),
    createApp: builder.mutation<{ app: AppDto }, Record<string, unknown>>({
      query: (body) => ({ url: "/api/apps", method: "POST", body }),
      invalidatesTags: ["Apps", "Dashboard"]
    }),
    updateApp: builder.mutation<{ app: AppDto }, { id: string; patch: Record<string, unknown> }>({
      query: ({ id, patch }) => ({ url: `/api/apps/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: (_result, _error, { id }) => ["Apps", "Dashboard", { type: "App", id }]
    }),
    archiveApp: builder.mutation<{ app: AppDto }, string>({
      query: (id) => ({ url: `/api/apps/${id}`, method: "DELETE" }),
      invalidatesTags: ["Apps", "Dashboard"]
    }),
    restoreApp: builder.mutation<{ app: AppDto }, string>({
      query: (id) => ({ url: `/api/apps/${id}/restore`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => ["Apps", "Dashboard", { type: "App", id }]
    }),
    permanentlyDeleteApp: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/apps/${id}/permanent`, method: "DELETE" }),
      invalidatesTags: ["Apps", "Dashboard"]
    }),
    addMilestone: builder.mutation<
      { milestone: MilestoneDto },
      { appId: string; title: string; dueDate?: string | null }
    >({
      query: ({ appId, ...body }) => ({
        url: `/api/apps/${appId}/milestones`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { appId }) => [
        "Apps",
        "Dashboard",
        "Milestones",
        { type: "App", id: appId }
      ]
    }),
    updateMilestone: builder.mutation<
      { milestone: MilestoneDto },
      { id: string; appId: string; patch: Partial<MilestoneDto> }
    >({
      query: ({ id, patch }) => ({ url: `/api/milestones/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: (_result, _error, { appId }) => [
        "Apps",
        "Dashboard",
        "Milestones",
        { type: "App", id: appId }
      ]
    }),
    addTask: builder.mutation<
      { task: TaskDto },
      { milestoneId: string; title: string; description?: string | null; dueDate?: string | null; timeMinutes?: number | null }
    >({
      query: ({ milestoneId, title, description, dueDate, timeMinutes }) => ({
        url: `/api/milestones/${milestoneId}/tasks`,
        method: "POST",
        body: { title, description: description || null, dueDate: dueDate || null, timeMinutes }
      }),
      invalidatesTags: ["Apps", "Dashboard", "Milestones"]
    }),
    updateTask: builder.mutation<
      { task: TaskDto },
      { id: string; milestoneId: string; patch: Partial<TaskDto> }
    >({
      query: ({ id, patch }) => ({ url: `/api/tasks/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: ["Apps", "Dashboard", "Milestones"]
    }),
    deleteTask: builder.mutation<void, { id: string; milestoneId: string }>({
      query: ({ id }) => ({ url: `/api/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: ["Apps", "Dashboard", "Milestones"]
    }),
    reorderTasks: builder.mutation<void, { orders: { id: string; sortOrder: number }[] }>({
      query: ({ orders }) => ({ url: "/api/tasks/reorder", method: "POST", body: { orders } }),
      invalidatesTags: ["Apps", "Dashboard", "Milestones"]
    }),
    activity: builder.query<{ activity: ActivityLogDto[] }, string>({
      query: (id) => `/api/apps/${id}/activity`,
      providesTags: ["Activity"]
    }),
    vaultEntries: builder.query<{ entries: VaultEntryDto[] }, { appId: string; reveal?: boolean }>({
      query: ({ appId, reveal }) => ({
        url: `/api/apps/${appId}/vault`,
        params: { reveal }
      }),
      providesTags: (_result, _error, { appId }) => [{ type: "Vault", id: appId }]
    }),
    createVaultEntry: builder.mutation<{ entry: VaultEntryDto }, { appId: string; body: Record<string, unknown> }>({
      query: ({ appId, body }) => ({ url: `/api/apps/${appId}/vault`, method: "POST", body }),
      invalidatesTags: (_result, _error, { appId }) => ["Activity", { type: "Vault", id: appId }]
    }),
    updateVaultEntry: builder.mutation<
      { entry: VaultEntryDto },
      { id: string; appId: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/api/vault/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { appId }) => ["Activity", { type: "Vault", id: appId }]
    }),
    deleteVaultEntry: builder.mutation<void, { id: string; appId: string }>({
      query: ({ id }) => ({ url: `/api/vault/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { appId }) => ["Activity", { type: "Vault", id: appId }]
    }),
    comments: builder.query<
      { comments: CommentDto[] },
      { taskId: string }
    >({
      query: ({ taskId }) => `/api/tasks/${taskId}/comments`,
      providesTags: (_result, _error, { taskId }) => [{ type: "Comments", id: taskId }]
    }),
    addComment: builder.mutation<
      { comment: CommentDto },
      { taskId: string; content: string }
    >({
      query: ({ taskId, content }) => ({
        url: `/api/tasks/${taskId}/comments`,
        method: "POST",
        body: { content }
      }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: "Comments", id: taskId }]
    }),
    deleteComment: builder.mutation<void, { id: string; taskId: string }>({
      query: ({ id }) => ({ url: `/api/comments/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: "Comments", id: taskId }]
    }),
    search: builder.query<SearchResultDto, { q: string }>({
      query: ({ q }) => `/api/search?q=${encodeURIComponent(q)}`,
      providesTags: ["Search"]
    }),
    attachments: builder.query<{ attachments: AttachmentDto[] }, { taskId: string }>({
      query: ({ taskId }) => `/api/tasks/${taskId}/attachments`,
      providesTags: (_result, _error, { taskId }) => [{ type: "Attachments", id: taskId }]
    }),
    uploadAttachment: builder.mutation<{ attachment: AttachmentDto }, { taskId: string; file: File }>({
      query: ({ taskId, file }) => {
        const fd = new FormData();
        fd.append("file", file);
        return { url: `/api/tasks/${taskId}/attachments`, method: "POST", body: fd };
      },
      invalidatesTags: (_result, _error, { taskId }) => [{ type: "Attachments", id: taskId }]
    }),
    deleteAttachment: builder.mutation<void, { id: string; taskId: string }>({
      query: ({ id }) => ({ url: `/api/attachments/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: "Attachments", id: taskId }]
    }),
    notifications: builder.query<NotificationsResponse, void>({
      query: () => "/api/notifications",
      providesTags: ["Notifications"]
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"]
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: "/api/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notifications"]
    }),
    inviteCollaborator: builder.mutation<{ invitation: InvitationDto }, { appId: string; email: string }>({
      query: ({ appId, email }) => ({ url: `/api/apps/${appId}/invite`, method: "POST", body: { email } }),
      invalidatesTags: (_result, _error, { appId }) => [{ type: "App", id: appId }]
    }),
    invitations: builder.query<{ invitations: InvitationDto[] }, void>({
      query: () => "/api/invitations",
      providesTags: ["Notifications"]
    }),
    acceptInvitation: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/invitations/${id}/accept`, method: "PATCH" }),
      invalidatesTags: ["Notifications", "Apps"]
    }),
    rejectInvitation: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/invitations/${id}/reject`, method: "PATCH" }),
      invalidatesTags: ["Notifications"]
    }),
    collaborators: builder.query<{ collaborators: CollaboratorDto[] }, string>({
      query: (appId) => `/api/apps/${appId}/collaborators`,
      providesTags: (_result, _error, appId) => [{ type: "App", id: appId }]
    }),
    removeCollaborator: builder.mutation<void, { appId: string; userId: string }>({
      query: ({ appId, userId }) => ({ url: `/api/apps/${appId}/collaborators/${userId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { appId }) => [{ type: "App", id: appId }]
    }),
    shareLinks: builder.query<{ shareLinks: ShareLinkDto[] }, string>({
      query: (appId) => `/api/apps/${appId}/share-links`,
      providesTags: (_result, _error, appId) => [{ type: "App", id: appId }]
    }),
    createShareLink: builder.mutation<{ shareLink: ShareLinkDto }, string>({
      query: (appId) => ({ url: `/api/apps/${appId}/share-links`, method: "POST" }),
      invalidatesTags: (_result, _error, appId) => [{ type: "App", id: appId }]
    }),
    changePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/api/auth/change-password", method: "POST", body }),
      invalidatesTags: ["Auth"]
    }),
    deleteShareLink: builder.mutation<void, { appId: string; id: string }>({
      query: ({ appId, id }) => ({ url: `/api/apps/${appId}/share-links/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { appId }) => [{ type: "App", id: appId }]
    })
  })
});

export const {
  useAddMilestoneMutation,
  useAppQuery,
  useAppsQuery,
  useArchiveAppMutation,
  useRestoreAppMutation,
  usePermanentlyDeleteAppMutation,
  useCreateAppMutation,
  useDashboardQuery,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useMeQuery,
  useRegisterMutation,
  useUserProfileQuery,
  useUpdateUserProfileMutation,
  useDeleteUserProfileMutation,
  useUpdateAppMutation,
  useUpdateMilestoneMutation,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useReorderTasksMutation,
  useVaultEntriesQuery,
  useCreateVaultEntryMutation,
  useUpdateVaultEntryMutation,
  useDeleteVaultEntryMutation,
  useCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useSearchQuery,
  useAttachmentsQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useInviteCollaboratorMutation,
  useInvitationsQuery,
  useAcceptInvitationMutation,
  useRejectInvitationMutation,
  useCollaboratorsQuery,
  useRemoveCollaboratorMutation,
  useShareLinksQuery,
  useCreateShareLinkMutation,
  useDeleteShareLinkMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation
} = api;
