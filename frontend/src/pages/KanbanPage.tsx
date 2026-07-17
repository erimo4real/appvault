import { Box, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ErrorState.js";
import { useAppsQuery } from "../features/api.js";
import { sortApps } from "./DashboardPage.js";

const columns = [
  { key: "todo", label: "To Do", color: "default" as const },
  { key: "inProgress", label: "In Progress", color: "warning" as const },
  { key: "done", label: "Done", color: "success" as const }
];

export function KanbanPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAppsQuery({});
  const apps = sortApps(data?.apps ?? [], "name");

  const milestones = apps.flatMap((app) =>
    (app.milestones ?? []).map((ms) => {
      const tasks = ms.tasks ?? [];
      const todo = tasks.filter((t) => t.status === "TODO").length;
      const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const done = tasks.filter((t) => t.status === "DONE").length;
      const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      return { ...ms, appName: app.name, appId: app.id, todo, inProgress, done, pct };
    })
  );

  const grouped: Record<string, typeof milestones> = { todo: [], inProgress: [], done: [] };
  for (const ms of milestones) {
    if (ms.pct === 0) grouped.todo.push(ms);
    else if (ms.pct === 100) grouped.done.push(ms);
    else grouped.inProgress.push(ms);
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Typography variant="h4">Kanban</Typography>
        <Typography color="text.secondary">Milestones grouped by completion status. Click a card to view the app.</Typography>
      </Box>
      {error && <ErrorState message="Could not load milestones." />}
      {isLoading && <Typography color="text.secondary">Loading...</Typography>}
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" }, minHeight: 400 }}>
        {columns.map((col) => {
          const items = grouped[col.key];
          return (
            <Box key={col.key} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, px: 1 }}>
                {col.label} ({items.length})
              </Typography>
              <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1, minHeight: 200, display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map((ms) => (
                  <Card
                    key={ms.id}
                    sx={{ cursor: "pointer", "&:hover": { boxShadow: 4, transform: "translateY(-2px)", transition: "all 0.2s" } }}
                    onClick={() => navigate(`/apps/${ms.appId}`)}
                  >
                    <CardContent>
                      <Typography variant="body2" fontWeight={700}>{ms.title}</Typography>
                      <Chip label={ms.appName} size="small" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: 11 }} />
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
                        <Chip label={`TODO ${ms.todo}`} size="small" sx={{ height: 20, fontSize: 11 }} />
                        <Chip label={`WIP ${ms.inProgress}`} size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />
                        <Chip label={`DONE ${ms.done}`} size="small" color="success" sx={{ height: 20, fontSize: 11 }} />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                        <LinearProgress variant="determinate" value={ms.pct} sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: col.key === "done" ? "success.light" : undefined }} color={col.key === "done" ? "success" : col.key === "inProgress" ? "warning" : "primary"} />
                        <Typography variant="caption" fontWeight={700}>{ms.pct}%</Typography>
                      </Stack>
                      {ms.dueDate && (
                        <Typography variant="caption" color={new Date(ms.dueDate) < new Date() && ms.pct < 100 ? "error" : "text.secondary"} sx={{ mt: 1, display: "block" }}>
                          Due: {new Date(ms.dueDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center", py: 4 }}>No milestones</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
