import type { AppStatus } from "../lib/shared.js";
import { Chip } from "@mui/material";

const colors: Record<AppStatus, { bg: string; color: string }> = {
  live: { bg: "#e8f5e9", color: "#2e7d32" },
  building: { bg: "#e3f2fd", color: "#1976d2" },
  idea: { bg: "#eceff1", color: "#546e7a" },
  archived: { bg: "#ffebee", color: "#d32f2f" }
};

export function StatusPill({ status }: { status: AppStatus }) {
  return (
    <Chip
      size="small"
      label={status}
      sx={{
        textTransform: "capitalize",
        bgcolor: colors[status].bg,
        color: colors[status].color,
        fontWeight: 700
      }}
    />
  );
}
