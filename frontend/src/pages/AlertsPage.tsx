import { NotificationsActive, Replay, WarningAmber } from "@mui/icons-material";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ErrorState.js";
import { useDashboardQuery } from "../features/api.js";

export function AlertsPage() {
  const navigate = useNavigate();
  const { data, error, isLoading } = useDashboardQuery();
  const overdue = data?.alerts.filter((alert) => alert.kind === "overdue_milestone").length ?? 0;
  const renewals = data?.alerts.filter((alert) => alert.kind === "renewal").length ?? 0;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Typography variant="h4">Alerts</Typography>
        <Typography color="text.secondary">Operational warnings for overdue work and upcoming renewals.</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}><Metric title="Total Alerts" value={data?.alerts.length ?? 0} icon={<NotificationsActive color="primary" />} /></Grid>
        <Grid item xs={12} md={4}><Metric title="Overdue" value={overdue} icon={<WarningAmber color="error" />} /></Grid>
        <Grid item xs={12} md={4}><Metric title="Renewals" value={renewals} icon={<Replay color="warning" />} /></Grid>
      </Grid>
      {error && <ErrorState message="Could not load alerts." />}
      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {data?.alerts.length ? data.alerts.map((alert) => (
              <Box
                key={alert.id}
                component="button"
                onClick={() => navigate(`/apps/${alert.appId}`)}
                sx={{
                  display: "block",
                  width: "100%",
                  p: 2.25,
                  border: 0,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#f8fafc" }
                }}
              >
                <Typography fontWeight={700}>{alert.message}</Typography>
                <Typography variant="body2" color="text.secondary">{alert.appName} - {new Date(alert.dueDate).toLocaleDateString()}</Typography>
              </Box>
            )) : <Box sx={{ p: 5, textAlign: "center" }}><Typography color="text.secondary">No active alerts.</Typography></Box>}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary">{title}</Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography>
          </Box>
          {icon}
        </Stack>
      </CardContent>
    </Card>
  );
}
