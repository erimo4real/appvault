import React from "react";
import ReactDOM from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { App } from "./App.js";
import { store, type RootState } from "./app/store.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { lightTheme, darkTheme } from "./app/theme.js";
import "./index.css";

function ThemedApp() {
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemedApp />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);