import { Box, Button, Typography } from "@mui/material";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 2, p: 4 }}>
          <Typography variant="h4">Something went wrong</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 480, textAlign: "center" }}>
            {this.state.error.message}
          </Typography>
          <Button variant="contained" onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}>
            Reload
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
