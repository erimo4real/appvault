import { createTheme } from "@mui/material/styles";

const components = {
  MuiCard: {
    styleOverrides: {
      root: {
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)"
        }
      }
    }
  },
  MuiButton: { defaultProps: { disableElevation: true } },
  MuiIconButton: {
    styleOverrides: { root: { transition: "color 0.2s ease, background-color 0.2s ease" } }
  },
  MuiChip: {
    styleOverrides: { root: { transition: "opacity 0.2s ease" } }
  }
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e" },
    secondary: { main: "#059669" },
    background: { default: "#f8fafc", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" },
    divider: "rgba(15, 23, 42, 0.1)"
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.1)" }
        }
      }
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiIconButton: {
      styleOverrides: { root: { transition: "color 0.2s ease, background-color 0.2s ease" } }
    }
  }
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#5eead4" },
    secondary: { main: "#34d399" },
    background: { default: "#0f172a", paper: "#1e293b" },
    text: { primary: "#f1f5f9", secondary: "#94a3b8" },
    divider: "rgba(241, 245, 249, 0.08)"
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(228, 232, 238, 0.06)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)" }
        }
      }
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiIconButton: {
      styleOverrides: { root: { transition: "color 0.2s ease, background-color 0.2s ease" } }
    }
  }
});