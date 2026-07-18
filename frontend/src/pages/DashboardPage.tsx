import type { AppDto } from "../lib/shared.js";
import { Add, AssignmentLate, CloudDone, Paid, Widgets } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { AppForm } from "../components/AppForm.js";
import { AppTable } from "../components/AppTable.js";
import { DashboardCharts } from "../components/DashboardCharts.js";
import { ErrorState } from "../components/ErrorState.js";
import { setFilter, setSort } from "../features/uiSlice.js";
import { useAppsQuery, useCreateAppMutation, useDashboardQuery } from "../features/api.js";

const filters = [
  ["all", "All"],
  ["personal", "My Builds"],
  ["client", "Clients"],
  ["saas", "SaaS"],
  ["archived", "Archived"]
] as const;

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { filter, sort } = useAppSelector((state) => state.ui);
  const [creating, setCreating] = useState(false);
  const queryArgs = {
    includeArchived: filter === "archived",
    type: ["personal", "client", "saas"].includes(filter) ? filter : undefined
  };
  const { data: dashboard, error: dashboardError, isLoading: dashboardLoading } = useDashboardQuery();
  const { data: appsData, error: appsError, isLoading: appsLoading } = useAppsQuery(queryArgs);
  const [createApp] = useCreateAppMutation();
  const apps = useMemo(() => sortApps(appsData?.apps ?? [], sort), [appsData, sort]);

  const cards = [
    { label: "Total Apps", value: dashboard?.metrics.totalApps ?? 0, icon: Widgets, color: "#0f766e", bg: "#e3f2fd" },
    { label: "Live", value: dashboard?.metrics.liveApps ?? 0, icon: CloudDone, color: "#2e7d32", bg: "#e8f5e9" },
    { label: "Monthly Spend", value: `$${dashboard?.metrics.monthlySpend ?? 0}`, icon: Paid, color: "#ed6c02", bg: "#fff3e0" },
    { label: "Overdue Tasks", value: dashboard?.metrics.overdueTasks ?? 0, icon: AssignmentLate, color: "#d32f2f", bg: "#ffebee" }
  ];

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          <Typography color="text.secondary">Track every app, client project, subscription, and delivery risk.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>
          New app
        </Button>
      </Stack>

      {dashboardError && <ErrorState message="Could not load dashboard metrics." />}

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">{card.label}</Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>{dashboardLoading ? "..." : card.value}</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: card.bg, color: card.color, display: "grid", placeItems: "center" }}>
                  <card.icon />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <DashboardCharts apps={appsData?.apps ?? []} alerts={dashboard?.alerts ?? []} />

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">Portfolio Apps</Typography>
              <Typography variant="body2" color="text.secondary">Filter, sort, and open records from the table.</Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={filter}
                onChange={(_event, value) => value && dispatch(setFilter(value))}
              >
                {filters.map(([value, label]) => <ToggleButton key={value} value={value}>{label}</ToggleButton>)}
              </ToggleButtonGroup>
              <Select size="small" value={sort} onChange={(event) => dispatch(setSort(event.target.value as never))}>
                <MenuItem value="updated">Last updated</MenuItem>
                <MenuItem value="due">Due date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="progress">Progress</MenuItem>
              </Select>
            </Stack>
          </Stack>
          {appsError && <ErrorState message="Could not load apps." />}
          {appsLoading ? <Typography color="text.secondary">Loading apps...</Typography> : <AppTable apps={apps} onSelect={() => {}} />}
        </CardContent>
      </Card>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="md">
        <DialogTitle>Create app</DialogTitle>
        <DialogContent>
          <AppForm
            onSubmit={async (values) => {
              await createApp(values).unwrap();
              setCreating(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export function sortApps(apps: AppDto[], sort: string) {
  return [...apps].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "progress") return (b.progress ?? 0) - (a.progress ?? 0);
    if (sort === "due") {
      return new Date(a.nextDueDate ?? "9999-12-31").getTime() - new Date(b.nextDueDate ?? "9999-12-31").getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
