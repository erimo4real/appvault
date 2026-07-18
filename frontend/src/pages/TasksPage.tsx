import { ExpandMore, Schedule, CheckCircle, WarningAmber } from "@mui/icons-material";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ErrorState.js";
import { useAppsQuery, useUpdateTaskMutation } from "../features/api.js";

export function TasksPage() {
  const navigate = useNavigate();
  const { data, error, isLoading } = useAppsQuery();
  const [updateTask] = useUpdateTaskMutation();
  const apps = data?.apps ?? [];

  const allTasks = apps.flatMap((app) => (app.milestones ?? []).flatMap((m) => (m.tasks ?? []).map((t) => ({ ...t, appName: app.name, appId: app.id, milestoneId: m.id }))));
  const completed = allTasks.filter((t) => t.status === "DONE").length;
  const remaining = allTasks.filter((t) => t.status !== "DONE").length;
  const progress = allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Typography variant="h4">Tasks</Typography>
        <Typography color="text.secondary">View and manage tasks grouped by app. Click an app to open the Kanban board.</Typography>
      </Box>
      <Grid container spacing={3}>
        {[
          ["Total Tasks", allTasks.length, Schedule, "#0f766e"],
          ["Completed", completed, CheckCircle, "#2e7d32"],
          ["Remaining", remaining, WarningAmber, "#d32f2f"]
        ].map(([label, value, Icon, color]) => (
          <Grid item xs={12} md={4} key={String(label)}>
            <Card><CardContent sx={{ display: "flex", justifyContent: "space-between" }}><Box><Typography color="text.secondary">{String(label)}</Typography><Typography variant="h5" sx={{ mt: 1 }}>{String(value)}</Typography></Box><Icon sx={{ color: String(color) }} /></CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Typography variant="h6">Overall Progress</Typography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 10, borderRadius: 999 }} />
            <Typography fontWeight={700}>{progress}%</Typography>
          </Stack>
        </CardContent>
      </Card>
      {error && <ErrorState message="Could not load tasks." />}
      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : apps.length === 0 ? (
        <Typography color="text.secondary">No apps yet.</Typography>
      ) : (
        <Stack spacing={2}>
          {apps.map((app) => {
            const milestones = app.milestones ?? [];
            const appTasks = milestones.flatMap((m) => m.tasks ?? []);
            const appDone = appTasks.filter((t) => t.status === "DONE").length;
            const appProgress = appTasks.length ? Math.round((appDone / appTasks.length) * 100) : 0;
            return (
              <Card key={app.id}>
                <CardContent sx={{ p: 0 }}>
                  <Box
                    onClick={() => navigate(`/tasks/${app.id}`)}
                    sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <Chip size="small" label={app.type} sx={{ textTransform: "capitalize" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={700}>{app.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{milestones.length} milestone(s) · {appDone}/{appTasks.length} tasks done</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={appProgress} sx={{ width: 100, height: 8, borderRadius: 999 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36, textAlign: "right" }}>{appProgress}%</Typography>
                  </Box>
                  {milestones.map((m) => {
                    const tasks = m.tasks ?? [];
                    const done = tasks.filter((t) => t.status === "DONE").length;
                    return (
                      <Accordion key={m.id} slotProps={{ transition: { unmountOnExit: true } }} sx={{ boxShadow: "none", "&:before": { display: "none" }, borderTop: "1px solid", borderColor: "divider" }}>
                        <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 40, "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}>
                          <CheckCircle fontSize="small" color={m.completed ? "success" : "disabled"} />
                          <Typography variant="body2" fontWeight={600}>{m.title}</Typography>
                          <Typography variant="caption" color="text.secondary">({done}/{tasks.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                          {tasks.map((task) => (
                            <Stack key={task.id} direction="row" alignItems="center" sx={{ py: 0.5, px: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ textDecoration: task.status === "DONE" ? "line-through" : "none", color: task.status === "DONE" ? "text.disabled" : "text.primary" }}>
                                  {task.title}
                                </Typography>
                                {task.dueDate && (
                                  <Typography variant="caption" color={task.status !== "DONE" && new Date(task.dueDate) < new Date() ? "error" : "text.secondary"}>
                                    Due {new Date(task.dueDate).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                              <Chip
                                label={task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "WIP" : "Todo"}
                                size="small"
                                color={task.status === "DONE" ? "success" : task.status === "IN_PROGRESS" ? "warning" : "default"}
                                variant={task.status === "DONE" ? "filled" : "outlined"}
                                sx={{ height: 20, fontSize: 11 }}
                                onClick={() => updateTask({ id: task.id, milestoneId: m.id, patch: { status: task.status === "DONE" ? "TODO" : task.status === "TODO" ? "IN_PROGRESS" : "DONE" } })}
                              />
                            </Stack>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
