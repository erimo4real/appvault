import { useMemo, useState } from "react";
import type { AppDto } from "@appvault/shared";
import {
  Box, Chip, InputAdornment, LinearProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, ToggleButton,
  ToggleButtonGroup, Typography
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { StatusPill } from "./StatusPill.js";

const typeFilters = [
  { label: "All", value: "" },
  { label: "Personal", value: "personal" },
  { label: "Client", value: "client" },
  { label: "SaaS", value: "saas" }
] as const;

const statusFilters = [
  { label: "All", value: "" },
  { label: "Idea", value: "idea" },
  { label: "Building", value: "building" },
  { label: "Live", value: "live" }
] as const;

export function AppTable({
  apps,
  onSelect
}: {
  apps: AppDto[];
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    return apps.filter((app) => {
      if (search && !app.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && app.type !== typeFilter) return false;
      if (statusFilter && app.status !== statusFilter) return false;
      return true;
    });
  }, [apps, search, typeFilter, statusFilter]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (apps.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
        <Typography color="text.secondary">No apps found for this view.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <TextField
          size="small" placeholder="Search apps..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
          sx={{ minWidth: 220 }}
        />
        <ToggleButtonGroup size="small" value={typeFilter} exclusive onChange={(_e, v) => { setTypeFilter(v ?? ""); setPage(0); }}>
          {typeFilters.map((f) => (
            <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5, py: 0.5, textTransform: "capitalize" }}>{f.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" value={statusFilter} exclusive onChange={(_e, v) => { setStatusFilter(v ?? ""); setPage(0); }}>
          {statusFilters.map((f) => (
            <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5, py: 0.5, textTransform: "capitalize" }}>{f.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        {filtered.length < apps.length && (
          <Typography variant="caption" color="text.secondary">{filtered.length} of {apps.length}</Typography>
        )}
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Milestones</TableCell>
              <TableCell>Tasks</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Monthly</TableCell>
              <TableCell>Next due</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 4 }}><Typography color="text.secondary">No matching apps.</Typography></TableCell></TableRow>
            ) : paged.map((app) => {
              const milestones = app.milestones ?? [];
              const allTasks = milestones.flatMap((m) => m.tasks ?? []);
              const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
              return (
                <TableRow key={app.id} hover onClick={() => onSelect(app.id)} sx={{ cursor: "pointer" }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{app.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 360 }}>
                      {app.description || "No description"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={app.type} sx={{ textTransform: "capitalize", bgcolor: "#eef5ff", color: "primary.main", fontWeight: 700 }} />
                  </TableCell>
                  <TableCell><StatusPill status={app.status} /></TableCell>
                  <TableCell>
                    <Typography variant="body2">{milestones.length}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{doneTasks}/{allTasks.length}</Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <LinearProgress variant="determinate" value={app.progress ?? 0} sx={{ width: 100, height: 8, borderRadius: 999 }} />
                      <Typography variant="caption" color="text.secondary">{app.progress ?? 0}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>${app.monthlyCost ?? 0}</TableCell>
                  <TableCell>{app.nextDueDate ? new Date(app.nextDueDate).toLocaleDateString() : "None"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={filtered.length} page={page} onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  );
}
