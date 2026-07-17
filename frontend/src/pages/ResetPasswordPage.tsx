import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../components/AuthCard.js";
import { useResetPasswordMutation } from "../features/api.js";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const initialToken = useMemo(() => params.get("token") ?? "", [params]);
  const [form, setForm] = useState({ token: initialToken, password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await resetPassword(form).unwrap();
      setMessage(result.message);
      setTimeout(() => navigate("/login"), 800);
    } catch {
      setError("Could not reset password. The token may be invalid or expired.");
    }
  }

  return (
    <AuthCard title="Set new password">
      <form className="space-y-4" onSubmit={submit}>
        <textarea
          className="min-h-24 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-slate-400"
          placeholder="Reset token"
          value={form.token}
          onChange={(event) => setForm({ ...form, token: event.target.value })}
          required
        />
        <input
          className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
          placeholder="New password"
          type="password"
          minLength={8}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        <button className="h-11 w-full rounded-md bg-slate-950 text-sm font-medium text-white" disabled={isLoading}>
          {isLoading ? "Resetting..." : "Reset password"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link className="font-medium text-slate-950" to="/login">Back to login</Link>
      </p>
    </AuthCard>
  );
}
