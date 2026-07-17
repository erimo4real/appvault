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
    primary: { main: "#1976d2" },
    secondary: { main: "#26c6da" },
    background: { default: "#f4f7fb", paper: "#ffffff" },
    text: { primary: "#2a3547", secondary: "#5a6a85" },
    divider: "rgba(42, 53, 71, 0.12)"
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
          border: "1px solid rgba(42, 53, 71, 0.08)",
          boxShadow: "0 2px 10px rgba(42, 53, 71, 0.04)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(42, 53, 71, 0.1)" }
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
    primary: { main: "#90caf9" },
    secondary: { main: "#80cbc4" },
    background: { default: "#0f1419", paper: "#1a1f2e" },
    text: { primary: "#e4e8ee", secondary: "#8892a4" },
    divider: "rgba(228, 232, 238, 0.08)"
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