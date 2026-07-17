import type { AppDto, DashboardAlert } from "@appvault/shared";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";

const statusColors = {
  live: "#2e7d32",
  building: "#1976d2",
  idea: "#90a4ae",
  archived: "#d32f2f"
};

export function DashboardCharts({ apps, alerts }: { apps: AppDto[]; alerts: DashboardAlert[] }) {
  const statusData = Object.entries(
    apps.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const spendData = apps
    .filter((app) => app.monthlyCost)
    .slice(0, 6)
    .map((app) => ({ name: app.name.slice(0, 12), spend: app.monthlyCost ?? 0 }));

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={7}>
        <Card>
          <CardContent>
            <Typography variant="h6">Monthly Spend</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              SaaS and project costs by app
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="spend" fill="#1976d2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={5}>
        <Card>
          <CardContent>
            <Typography variant="h6">Status Mix</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current portfolio distribution
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={statusColors[entry.name as keyof typeof statusColors] ?? "#26c6da"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Recent Alerts</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Overdue milestones and renewals inside the next 7 days
            </Typography>
            {alerts.length ? (
              alerts.slice(0, 4).map((alert) => (
                <Box key={alert.id} sx={{ display: "flex", justifyContent: "space-between", py: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="body2" fontWeight={700}>{alert.message}</Typography>
                  <Typography variant="body2" color="text.secondary">{new Date(alert.dueDate).toLocaleDateString()}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No active alerts right now.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
