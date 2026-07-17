import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../app/hooks.js";
import { setUser } from "../features/authSlice.js";
import { useLoginMutation } from "../features/api.js";
import { AuthCard } from "../components/AuthCard.js";

const STORAGE_KEY = "appvault_remember";

function loadRemembered(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string;
  } catch { /* ignore */ }
  return "";
}

function saveRemembered(email: string) {
  if (email) localStorage.setItem(STORAGE_KEY, JSON.stringify(email));
  else localStorage.removeItem(STORAGE_KEY);
}

export function LoginPage() {
  const [form, setForm] = useState({ email: loadRemembered(), password: "" });
  const [remember, setRemember] = useState(!!form.email);
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await login({ ...form, rememberMe: remember }).unwrap();
      dispatch(setUser(result.user));
      saveRemembered(remember ? form.email : "");
      navigate("/dashboard");
    } catch {
      setError("Could not sign in. Check your email and password.");
    }
  }

  return (
    <AuthCard title="Welcome back">
      <form className="space-y-4" onSubmit={submit}>
        <input
          className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
          Remember me
        </label>
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button className="h-11 w-full rounded-md bg-slate-950 text-sm font-medium text-white" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link className="font-medium text-slate-950" to="/forgot-password">Forgot password?</Link>
      </p>
      <p className="mt-4 text-center text-sm text-slate-500">
        New here? <Link className="font-medium text-slate-950" to="/register">Create an account</Link>
      </p>
    </AuthCard>
  );
}