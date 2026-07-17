import type { AppType } from "../lib/shared.js";
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks.js";
import { AppTable } from "../components/AppTable.js";
import { DashboardCharts } from "../components/DashboardCharts.js";
import { ErrorState } from "../components/ErrorState.js";
import { useAppsQuery, useDashboardQuery } from "../features/api.js";
import { sortApps } from "./DashboardPage.js";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function downloadExport(format: "csv" | "json") {
  window.open(`${baseUrl}/api/export/${format}`, "_blank");
}

export function AppsPage({ forcedFilter, title }: { forcedFilter?: AppType; title: string }) {
  const navigate = useNavigate();
  const { sort } = useAppSelector((state) => state.ui);
  const { data, error, isLoading } = useAppsQuery(forcedFilter ? { type: forcedFilter } : {});
  const { data: dashboard } = useDashboardQuery();
  const apps = sortApps(data?.apps ?? [], sort);
  const live = apps.filter((app) => app.status === "live").length;
  const spend = apps.reduce((sum, app) => sum + (app.monthlyCost ?? 0), 0);
  const avgProgress = apps.length ? Math.round(apps.reduce((sum, app) => sum + (app.progress ?? 0), 0) / apps.length) : 0;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h4">{title}</Typography>
          <Typography color="text.secondary">{forcedFilter ? `A focused view of your ${title.toLowerCase()}.` : "Manage all your apps and projects."}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => downloadExport("csv")}>Export CSV</Button>
          <Button size="small" variant="outlined" onClick={() => downloadExport("json")}>Export JSON</Button>
        </Stack>
      </Box>
      <Grid container spacing={3}>
        {[
          ["Records", apps.length],
          ["Live", live],
          ["Monthly Cost", `$${spend}`],
          ["Avg Progress", `${avgProgress}%`]
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} lg={3} key={label}>
            <Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography></CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <DashboardCharts apps={apps} alerts={dashboard?.alerts.filter((alert) => apps.some((app) => app.id === alert.appId)) ?? []} />
      <Card>
        <CardContent>
          {error && <ErrorState message={`Could not load ${title.toLowerCase()}.`} />}
          {isLoading ? <Typography color="text.secondary">Loading...</Typography> : <AppTable apps={apps} onSelect={(id) => navigate(`/apps/${id}`)} />}
        </CardContent>
      </Card>
    </Box>
  );
}
