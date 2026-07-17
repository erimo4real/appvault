import { useMemo, useRef, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, TextField, Typography
} from "@mui/material";
import { Add, AttachFile, Close, DeleteOutline } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState.js";
import {
  useAddCommentMutation, useAddTaskMutation, useAppsQuery, useAttachmentsQuery,
  useCommentsQuery, useDeleteAttachmentMutation, useDeleteCommentMutation,
  useDeleteTaskMutation, useUpdateTaskMutation, useUploadAttachmentMutation
} from "../features/api.js";
import type { TaskDto } from "../lib/shared.js";

type TaskWithMeta = TaskDto & { appName: string; appId: string; milestoneId: string; milestoneName: string };

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done"
};

const statusColors: Record<string, "default" | "warning" | "success"> = {
  TODO: "default",
  IN_PROGRESS: "warning",
  DONE: "success"
};

const columns = ["TODO", "IN_PROGRESS", "DONE"];

export function AppTasksPage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAppsQuery();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addTask] = useAddTaskMutation();
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [editDescription, setEditDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const { data: commentsData } = useCommentsQuery({ taskId: selectedTask?.id ?? "" }, { skip: !selectedTask });
  const { data: attachmentsData } = useAttachmentsQuery({ taskId: selectedTask?.id ?? "" }, { skip: !selectedTask });
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskMilestoneId, setNewTaskMilestoneId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const app = useMemo(() => data?.apps.find((a) => a.id === appId), [data?.apps, appId]);
  const milestones = app?.milestones ?? [];
  const allTasks: TaskWithMeta[] = useMemo(
    () => milestones.flatMap((ms) =>
      (ms.tasks ?? []).map((task) => ({
        ...task, appName: app?.name ?? "", appId: app?.id ?? "", milestoneId: ms.id, milestoneName: ms.title
      }))
    ),
    [milestones, app?.name, app?.id]
  );

  const grouped = useMemo(() => {
    const g: Record<string, TaskWithMeta[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of allTasks) {
      g[t.status]?.push(t);
    }
    return g;
  }, [allTasks]);

  function handleDragStart(taskId: string) {
    setDragId(taskId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(status: string) {
    if (!dragId) return;
    const task = allTasks.find((t) => t.id === dragId);
    if (!task || task.status === status) return;
    await updateTask({ id: dragId, milestoneId: task.milestoneId, patch: { status: status as "TODO" | "IN_PROGRESS" | "DONE" } });
    setDragId(null);
  }

  async function handleCreateTask() {
    if (!newTaskTitle.trim() || !newTaskMilestoneId) return;
    await addTask({
      milestoneId: newTaskMilestoneId,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || null,
      dueDate: newTaskDue || null
    });
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskDue("");
    setNewTaskMilestoneId("");
    setShowNewTask(false);
  }

  async function handleDeleteTask(taskId: string, milestoneId: string) {
    await deleteTask({ id: taskId, milestoneId });
    if (selectedTask?.id === taskId) setSelectedTask(null);
  }

  async function handleSaveDescription() {
    if (!selectedTask) return;
    await updateTask({ id: selectedTask.id, milestoneId: selectedTask.milestoneId, patch: { description: editDescription || null } });
    setEditingDesc(false);
  }

  if (!appId) return null;
  if (isLoading) return <Typography color="text.secondary" sx={{ p: 4 }}>Loading...</Typography>;
  if (error) return <ErrorState message="Could not load app." />;
  if (!app) return <ErrorState message="App not found." />;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Button variant="text" onClick={() => navigate("/tasks")} sx={{ minWidth: 0, fontSize: 14 }}>Tasks</Button>
            <Typography color="text.disabled">/</Typography>
            <Typography variant="h5">{app.name}</Typography>
          </Stack>
          <Typography color="text.secondary">Drag tasks between columns to update status.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setShowNewTask(true)}>
          New Task
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" }, minHeight: 400 }}>
        {columns.map((col) => {
          const tasks = grouped[col] ?? [];
          return (
            <Box key={col} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, px: 1 }}>
                {statusLabels[col]} ({tasks.length})
              </Typography>
              <Box
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col)}
                sx={{
                  bgcolor: "action.hover", borderRadius: 2, p: 1, minHeight: 200,
                  display: "flex", flexDirection: "column", gap: 1,
                  transition: "background-color 0.2s"
                }}
              >
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => { setSelectedTask(task); setEditDescription(task.description ?? ""); setEditingDesc(false); }}
                    sx={{
                      cursor: "grab", "&:hover": { boxShadow: 4 },
                      opacity: dragId === task.id ? 0.4 : 1
                    }}
                  >
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.description}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={task.milestoneName} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                        {task.dueDate && (
                          <Typography variant="caption" color={new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "error" : "text.secondary"}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} fullWidth maxWidth="sm">
        {selectedTask && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip label={statusLabels[selectedTask.status]} size="small" color={statusColors[selectedTask.status]} />
              <Typography variant="h6" sx={{ flex: 1 }}>{selectedTask.title}</Typography>
              <IconButton onClick={() => setSelectedTask(null)}><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Button size="small" variant={selectedTask.status === "TODO" ? "contained" : "outlined"} onClick={() => { updateTask({ id: selectedTask.id, milestoneId: selectedTask.milestoneId, patch: { status: "TODO" } }); }}>To Do</Button>
                  <Button size="small" variant={selectedTask.status === "IN_PROGRESS" ? "contained" : "outlined"} color="warning" onClick={() => { updateTask({ id: selectedTask.id, milestoneId: selectedTask.milestoneId, patch: { status: "IN_PROGRESS" } }); }}>In Progress</Button>
                  <Button size="small" variant={selectedTask.status === "DONE" ? "contained" : "outlined"} color="success" onClick={() => { updateTask({ id: selectedTask.id, milestoneId: selectedTask.milestoneId, patch: { status: "DONE" } }); }}>Done</Button>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Milestone</Typography>
                  <Typography variant="body2">{selectedTask.milestoneName}</Typography>
                </Box>

                {selectedTask.dueDate && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">Due date</Typography>
                    <Typography variant="body2">{new Date(selectedTask.dueDate).toLocaleDateString()}</Typography>
                  </Box>
                )}

                {selectedTask.createdAt && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">Created</Typography>
                    <Typography variant="body2">{new Date(selectedTask.createdAt).toLocaleString()}</Typography>
                  </Box>
                )}

                {selectedTask.timeMinutes != null && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">Time estimate</Typography>
                    <Typography variant="body2">{selectedTask.timeMinutes >= 60 ? `${Math.floor(selectedTask.timeMinutes / 60)}h ${selectedTask.timeMinutes % 60}m` : `${selectedTask.timeMinutes}m`}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Description</Typography>
                  {editingDesc ? (
                    <Stack spacing={1} sx={{ mt: 0.5 }}>
                      <TextField multiline minRows={3} size="small" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={handleSaveDescription}>Save</Button>
                        <Button size="small" onClick={() => setEditingDesc(false)}>Cancel</Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color={selectedTask.description ? "text.primary" : "text.disabled"} sx={{ cursor: "pointer", minHeight: 32, display: "flex", alignItems: "center" }} onClick={() => setEditingDesc(true)}>
                      {selectedTask.description || "Add a description..."}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Attachments</Typography>
                  <Stack spacing={1} sx={{ mt: 0.5 }}>
                    {attachmentsData?.attachments.map((a) => (
                      <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AttachFile fontSize="small" color="disabled" />
                        <Typography variant="caption" sx={{ flex: 1 }}>{a.fileName} ({(a.fileSize / 1024).toFixed(0)}KB)</Typography>
                        <IconButton size="small" onClick={() => deleteAttachment({ id: a.id, taskId: selectedTask.id })}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button size="small" variant="outlined" component="label">
                      <AttachFile fontSize="small" sx={{ mr: 0.5 }} /> Attach
                      <input type="file" hidden ref={fileRef} onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await uploadAttachment({ taskId: selectedTask.id, file: f }); if (fileRef.current) fileRef.current.value = ""; } }} />
                    </Button>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Comments</Typography>
                  <Stack spacing={1} sx={{ mt: 0.5 }}>
                    {commentsData?.comments.map((c) => (
                      <Box key={c.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{c.content}</Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>{new Date(c.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => deleteComment({ id: c.id, taskId: selectedTask.id })}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <input className="field" placeholder="Add comment..." value={commentInputs[selectedTask.id] ?? ""} onChange={(e) => setCommentInputs((prev) => ({ ...prev, [selectedTask.id]: e.target.value }))} style={{ flex: 1 }} />
                      <Button size="small" variant="outlined" onClick={async () => { const text = (commentInputs[selectedTask.id] ?? "").trim(); if (text) { await addComment({ taskId: selectedTask.id, content: text }); setCommentInputs((prev) => ({ ...prev, [selectedTask.id]: "" })); } }}>Send</Button>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button color="error" startIcon={<DeleteOutline />} onClick={() => handleDeleteTask(selectedTask.id, selectedTask.milestoneId)}>
                Delete
              </Button>
              <Button onClick={() => setSelectedTask(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={showNewTask} onClose={() => setShowNewTask(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth autoFocus label="Title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
            <TextField fullWidth multiline minRows={2} label="Description" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} />
            <TextField fullWidth type="date" label="Due date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField fullWidth select label="Milestone" value={newTaskMilestoneId} onChange={(e) => setNewTaskMilestoneId(e.target.value)} SelectProps={{ native: true }} slotProps={{ inputLabel: { shrink: true } }}>
              <option value="">Select milestone...</option>
              {milestones.map((ms) => (
                <option key={ms.id} value={ms.id}>{ms.title}</option>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewTask(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTask} disabled={!newTaskTitle.trim() || !newTaskMilestoneId}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
