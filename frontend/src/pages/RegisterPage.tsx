import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../app/hooks.js";
import { setUser } from "../features/authSlice.js";
import { useRegisterMutation } from "../features/api.js";
import { AuthCard } from "../components/AuthCard.js";

export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await register(form).unwrap();
      dispatch(setUser(result.user));
      navigate("/dashboard");
    } catch {
      setError("Could not create your account. Try another email or stronger password.");
    }
  }

  return (
    <AuthCard title="Create your vault">
      <form className="space-y-4" onSubmit={submit}>
        <input
          className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
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
          minLength={8}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button className="h-11 w-full rounded-md bg-slate-950 text-sm font-medium text-white" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link className="font-medium text-slate-950" to="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}
