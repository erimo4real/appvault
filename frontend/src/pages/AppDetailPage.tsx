import { FormEvent, useEffect, useRef, useState } from "react";
import { Add, AttachFile, Check, Close, CommentOutlined, DeleteOutline, ExpandMore } from "@mui/icons-material";
import {
  Accordion, AccordionSummary, AccordionDetails, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, LinearProgress, Stack, Tab, Tabs, TextField, Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAddCommentMutation, useAddMilestoneMutation, useAddTaskMutation,
  useAppQuery, useAttachmentsQuery, useUploadAttachmentMutation, useDeleteAttachmentMutation,
  useArchiveAppMutation, useCollaboratorsQuery, useCommentsQuery, useCreateShareLinkMutation,
  useDeleteCommentMutation, useDeleteShareLinkMutation, useDeleteTaskMutation,
  useInviteCollaboratorMutation, usePermanentlyDeleteAppMutation, useRemoveCollaboratorMutation,
  useReorderTasksMutation, useRestoreAppMutation, useShareLinksQuery, useUpdateAppMutation,
  useUpdateMilestoneMutation, useUpdateTaskMutation
} from "../features/api.js";
import { AppForm } from "../components/AppForm.js";
import { ErrorState } from "../components/ErrorState.js";
import { VaultSection } from "../components/VaultSection.js";

export function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAppQuery(id!, { skip: !id });
  const [tab, setTab] = useState(0);
  const [updateApp] = useUpdateAppMutation();
  const [archiveApp] = useArchiveAppMutation();
  const [restoreApp] = useRestoreAppMutation();
  const [permanentlyDeleteApp] = usePermanentlyDeleteAppMutation();
  const [addMilestone] = useAddMilestoneMutation();
  const [updateMilestone] = useUpdateMilestoneMutation();
  const [addTask] = useAddTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [reorderTasks] = useReorderTasksMutation();
  const [dragId, setDragId] = useState<string | null>(null);
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const { data: commentsData } = useCommentsQuery({ taskId: commentTaskId! }, { skip: !commentTaskId });
  const { data: attachmentsData } = useAttachmentsQuery({ taskId: commentTaskId! }, { skip: !commentTaskId });
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const [taskDates, setTaskDates] = useState<Record<string, string>>({});
  const [taskTimes, setTaskTimes] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | false>(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);
  const { data: collabData } = useCollaboratorsQuery(id!, { skip: !id || !collabOpen });
  const [inviteCollab] = useInviteCollaboratorMutation();
  const [removeCollab] = useRemoveCollaboratorMutation();
  const [shareOpen, setShareOpen] = useState(false);
  const { data: shareData } = useShareLinksQuery(id!, { skip: !id || !shareOpen });
  const [createShare] = useCreateShareLinkMutation();
  const [deleteShare] = useDeleteShareLinkMutation();

  const milestones = data?.app?.milestones ?? [];

  useEffect(() => {
    setTab(0);
  }, [id]);

  useEffect(() => {
    if (milestones.length > 0) setExpanded(milestones[0].id);
  }, [milestones.length]);

  async function createMilestone(event: FormEvent) {
    event.preventDefault();
    if (!id || !milestoneTitle.trim()) return;
    await addMilestone({ appId: id, title: milestoneTitle.trim(), dueDate: milestoneDue || null });
    setMilestoneTitle("");
    setMilestoneDue("");
  }

  async function addTaskTo(milestoneId: string) {
    const title = taskInputs[milestoneId]?.trim();
    if (!title) return;
    await addTask({ milestoneId, title, dueDate: taskDates[milestoneId] || null, timeMinutes: taskTimes[milestoneId] || null });
    setTaskInputs((prev) => ({ ...prev, [milestoneId]: "" }));
    setTaskDates((prev) => ({ ...prev, [milestoneId]: "" }));
    setTaskTimes((prev) => ({ ...prev, [milestoneId]: 0 }));
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).style.opacity = "0.5";
  }

  function handleDragLeave(event: React.DragEvent) {
    (event.currentTarget as HTMLElement).style.opacity = "1";
  }

  async function handleDrop(milestoneId: string, targetIdx: number) {
    const tasks = milestones.find((m) => m.id === milestoneId)?.tasks ?? [];
    if (!dragId) return;
    const fromIdx = tasks.findIndex((t) => t.id === dragId);
    if (fromIdx === -1 || fromIdx === targetIdx) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const orders = reordered.map((t, i) => ({ id: t.id, sortOrder: i }));
    await reorderTasks({ orders });
  }

  async function hardDelete(appId: string) {
    const ok = window.confirm("Permanently delete this app and all related data? This cannot be undone.");
    if (!ok) return;
    await permanentlyDeleteApp(appId).unwrap();
    navigate("/dashboard");
  }

  const allTasks = milestones.flatMap((m) => m.tasks ?? []);
  const totalCompleted = allTasks.filter((t) => t.status === "DONE").length;

  if (!id) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Button variant="text" onClick={() => navigate(-1)} sx={{ minWidth: 0 }}>Back</Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">{data?.app?.name ?? "Loading..."}</Typography>
          <Typography variant="body2" color="text.secondary">App details</Typography>
        </Box>
      </Stack>

      <Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Milestones" />
        <Tab label="Vault" />
        <Tab label="Activity" />
      </Tabs>

      {isLoading && <Typography color="text.secondary">Loading...</Typography>}
      {error && <ErrorState message="Could not load this app." />}

      {data?.app && tab === 0 && (
        <Stack spacing={2.5}>
          <AppForm
            initial={data.app}
            onSubmit={async (values) => {
              await updateApp({ id: data.app.id, patch: values });
            }}
          />
          <Stack direction="row" spacing={1}>
            {data.app.status === "archived" ? (
              <Button fullWidth variant="outlined" onClick={() => restoreApp(data.app.id)}>
                Restore
              </Button>
            ) : (
              <Button fullWidth color="warning" variant="outlined" onClick={() => archiveApp(data.app.id)}>
                Archive
              </Button>
            )}
            <Button fullWidth color="error" variant="outlined" onClick={() => hardDelete(data.app.id)}>
              Delete
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" onClick={() => { setInviteOpen(true); setInviteResult(null); setInviteError(null); setInviteEmail(""); }}>
              Invite
            </Button>
            <Button fullWidth variant="outlined" onClick={() => setCollabOpen(!collabOpen)}>
              {collabOpen ? "Hide collaborators" : "Collaborators"}
            </Button>
            <Button fullWidth variant="outlined" onClick={() => setShareOpen(true)}>
              Share
            </Button>
          </Stack>
          {collabOpen && collabData && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Collaborators</Typography>
              {collabData.collaborators.map((c) => (
                <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{c.user.name ?? c.user.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.role}</Typography>
                  </Box>
                  <Button size="small" color="error" onClick={() => removeCollab({ appId: data.app.id, userId: c.userId })}>
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {data?.app && tab === 1 && (
        <Box>
          <Box component="form" onSubmit={createMilestone} sx={{ display: "flex", gap: 1, mb: 2 }}>
            <input className="field" placeholder="New milestone..." value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} style={{ flex: 1 }} />
            <input className="field" type="date" value={milestoneDue} onChange={(e) => setMilestoneDue(e.target.value)} style={{ width: 140 }} />
            <Button type="submit" variant="contained" size="small"><Add /></Button>
          </Box>
          <Stack spacing={1}>
            {milestones.map((milestone) => {
              const tasks = milestone.tasks ?? [];
              const done = tasks.filter((t) => t.status === "DONE").length;
              const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
              const totalMinutes = tasks.reduce((sum, t) => sum + (t.timeMinutes ?? 0), 0);
              return (
                <Accordion key={milestone.id} expanded={expanded === milestone.id} onChange={(_e, isExpanded) => setExpanded(isExpanded ? milestone.id : false)} slotProps={{ transition: { unmountOnExit: true } }}>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 48, "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5 } }}>
                    <Check fontSize="small" color={milestone.completed ? "success" : "disabled"} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{milestone.title}</Typography>
                      {tasks.length > 0 && (
                        <Typography variant="caption" color="text.secondary">{done}/{tasks.length} done{totalMinutes > 0 ? ` · ${totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`}` : ""}</Typography>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Stack spacing={0.5} sx={{ mb: 1 }}>
                      {tasks.map((task, idx) => {
                        const overdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();
                        const statusColor = task.status === "DONE" ? "success" as const : task.status === "IN_PROGRESS" ? "warning" as const : "default" as const;
                        const statusLabel = task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "WIP" : "Todo";
                        const nextStatus = task.status === "TODO" ? "IN_PROGRESS" as const : task.status === "IN_PROGRESS" ? "DONE" as const : "TODO" as const;
                        return (
                          <Box key={task.id}>
                            <Box
                              draggable
                              onDragStart={() => setDragId(task.id)}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDragEnd={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                              onDrop={() => handleDrop(milestone.id, idx)}
                              sx={{ display: "flex", alignItems: "center", gap: 1, borderRadius: 1, cursor: "grab", "&:hover .del-task": { opacity: 1 } }}
                            >
                              <Chip
                                label={statusLabel}
                                size="small"
                                color={statusColor}
                                variant={task.status === "DONE" ? "filled" : "outlined"}
                                onClick={() => updateTask({ id: task.id, milestoneId: milestone.id, patch: { status: nextStatus } })}
                                sx={{ height: 22, fontSize: 11, cursor: "pointer" }}
                              />
                              <Typography variant="body2" sx={{ flex: 1, textDecoration: task.status === "DONE" ? "line-through" : "none", color: task.status === "DONE" ? "text.disabled" : "text.primary" }}>
                                {task.title}
                              </Typography>
                              {task.dueDate && (
                                <Typography variant="caption" color={overdue ? "error" : "text.secondary"}>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </Typography>
                              )}
                              {task.timeMinutes != null && (
                                <Typography variant="caption" color="text.secondary">
                                  {task.timeMinutes >= 60 ? `${Math.floor(task.timeMinutes / 60)}h ${task.timeMinutes % 60}m` : `${task.timeMinutes}m`}
                                </Typography>
                              )}
                              <IconButton size="small" onClick={() => setCommentTaskId(commentTaskId === task.id ? null : task.id)}>
                                <CommentOutlined fontSize="small" color={commentTaskId === task.id ? "primary" : "disabled"} />
                              </IconButton>
                              <IconButton size="small" className="del-task" sx={{ opacity: 0, transition: "opacity 0.2s" }} onClick={() => deleteTask({ id: task.id, milestoneId: milestone.id })}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Box>
                            {commentTaskId === task.id && (
                              <Box sx={{ pl: 4, pr: 1, py: 1 }}>
                                <Stack spacing={1}>
                                  {attachmentsData?.attachments.map((a) => (
                                    <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <AttachFile fontSize="small" color="disabled" />
                                      <Typography variant="caption" sx={{ flex: 1 }}>{a.fileName} ({(a.fileSize / 1024).toFixed(0)}KB)</Typography>
                                      <IconButton size="small" onClick={() => deleteAttachment({ id: a.id, taskId: task.id })}>
                                        <Close fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ))}
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button size="small" variant="outlined" component="label">
                                      <AttachFile fontSize="small" sx={{ mr: 0.5 }} /> Attach
                                      <input type="file" hidden ref={fileRef} onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await uploadAttachment({ taskId: task.id, file: f }); if (fileRef.current) fileRef.current.value = ""; } }} />
                                    </Button>
                                  </Box>
                                  {commentsData?.comments.map((c) => (
                                    <Box key={c.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                      <Typography variant="caption" color="text.secondary">{c.content}</Typography>
                                      <IconButton size="small" onClick={() => deleteComment({ id: c.id, taskId: task.id })}>
                                        <Close fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ))}
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <input className="field" placeholder="Add comment..." value={commentInputs[task.id] ?? ""} onChange={(e) => setCommentInputs((prev) => ({ ...prev, [task.id]: e.target.value }))} style={{ flex: 1 }} />
                                    <Button size="small" variant="outlined" onClick={async () => { const text = (commentInputs[task.id] ?? "").trim(); if (text) { await addComment({ taskId: task.id, content: text }); setCommentInputs((prev) => ({ ...prev, [task.id]: "" })); } }}>Send</Button>
                                  </Box>
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <input className="field" placeholder="Add task..." value={taskInputs[milestone.id] ?? ""} onChange={(e) => setTaskInputs((prev) => ({ ...prev, [milestone.id]: e.target.value }))} style={{ flex: 1 }} />
                      <input className="field" type="date" value={taskDates[milestone.id] ?? ""} onChange={(e) => setTaskDates((prev) => ({ ...prev, [milestone.id]: e.target.value }))} style={{ width: 130 }} />
                      <input className="field" type="number" min="0" placeholder="min" value={taskTimes[milestone.id] ?? ""} onChange={(e) => setTaskTimes((prev) => ({ ...prev, [milestone.id]: parseInt(e.target.value) || 0 }))} style={{ width: 60 }} />
                      <Button size="small" variant="outlined" onClick={() => addTaskTo(milestone.id)}>Add</Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        </Box>
      )}

      {data?.app && tab === 2 && <VaultSection appId={data.app.id} />}

      {data?.app && tab === 3 && (
        <Stack spacing={2}>
            {data.app.activity?.map((entry) => (
            <Box key={entry.id} sx={{ borderLeft: "2px solid", borderColor: "primary.main", pl: 1.5 }}>
              <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{entry.action.replaceAll("_", " ")}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(entry.createdAt).toLocaleString()}</Typography>
            </Box>
          ))}
        </Stack>
      )}

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Share this app</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {shareData?.shareLinks.map((link) => {
              const url = `${window.location.origin}/share/${link.token}`;
              return (
                <Box key={link.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField fullWidth size="small" value={url} slotProps={{ input: { readOnly: true } }} />
                  <Button size="small" variant="outlined" onClick={() => navigator.clipboard.writeText(url)}>Copy</Button>
                  <IconButton size="small" color="error" onClick={() => deleteShare({ appId: id!, id: link.id })}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
            <Button variant="contained" onClick={() => createShare(id!)}>Generate new link</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Invite collaborator</DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus label="Email address" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} sx={{ mt: 1 }} />
          {inviteResult && <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>{inviteResult}</Typography>}
          {inviteError && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{inviteError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            setInviteResult(null);
            setInviteError(null);
            try {
              await inviteCollab({ appId: id!, email: inviteEmail.trim() }).unwrap();
              setInviteResult("Invitation sent.");
              setInviteEmail("");
            } catch (err: unknown) {
              const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to send invitation.";
              setInviteError(msg);
            }
          }}>Send invite</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
