import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppDispatch } from "./app/hooks.js";
import { markBootstrapped, setUser } from "./features/authSlice.js";
import { useMeQuery } from "./features/api.js";

function LoadingScreen() {
  const [chars, setChars] = useState(0);
  const word = "AppVault";
  useEffect(() => {
    if (chars >= word.length) return;
    const t = setTimeout(() => setChars((c) => c + 1), 120);
    return () => clearTimeout(t);
  }, [chars]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-3xl font-bold tracking-widest" style={{ fontFamily: "Inter, sans-serif", color: "#0f766e" }}>
        {word.slice(0, chars)}
        <span className="animate-pulse" style={{ opacity: chars < word.length ? 1 : 0 }}>|</span>
      </span>
    </div>
  );
}
import { AppLayout } from "./components/AppLayout.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { AppDetailPage } from "./pages/AppDetailPage.js";
import { AppsPage } from "./pages/AppsPage.js";
import { MilestonesPage } from "./pages/MilestonesPage.js";
import { AlertsPage } from "./pages/AlertsPage.js";
import { KanbanPage } from "./pages/KanbanPage.js";
import { TasksPage } from "./pages/TasksPage.js";
import { AppTasksPage } from "./pages/AppTasksPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";

export function App() {
  const dispatch = useAppDispatch();
  const { data, error, isLoading } = useMeQuery();

  useEffect(() => {
    if (data?.user) dispatch(setUser(data.user));
    if (error) dispatch(markBootstrapped());
  }, [data, error, dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/apps" element={<AppsPage title="All Apps" />} />
        <Route path="/apps/:id" element={<AppDetailPage />} />
        <Route path="/my-apps" element={<AppsPage forcedFilter="personal" title="My Apps" />} />
        <Route path="/clients" element={<AppsPage forcedFilter="client" title="Clients" />} />
        <Route path="/subscriptions" element={<AppsPage forcedFilter="saas" title="Subscriptions" />} />
        <Route path="/milestones" element={<MilestonesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:appId" element={<AppTasksPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
