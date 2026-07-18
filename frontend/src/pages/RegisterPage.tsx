import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../app/hooks.js";
import { setUser } from "../features/authSlice.js";
import { useRegisterMutation } from "../features/api.js";
import { AuthCard } from "../components/AuthCard.js";

export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const passwordRequirements = [
    { label: "At least 8 characters", met: form.password.length >= 8 },
    { label: "At least 1 uppercase letter", met: /[A-Z]/.test(form.password) },
    { label: "At least 1 lowercase letter", met: /[a-z]/.test(form.password) },
    { label: "At least 1 number", met: /\d/.test(form.password) },
  ];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    try {
      const result = await register(form).unwrap();
      dispatch(setUser(result.user));
      navigate("/dashboard");
    } catch (err: unknown) {
      const data = (err as { data?: { error?: string; details?: { fieldErrors?: Record<string, string[]> } } })?.data;
      if (data?.details?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(data.details.fieldErrors)) {
          if (msgs.length) fieldErrors[field] = msgs[0];
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ form: data?.error ?? "Could not create your account." });
      }
    }
  }

  return (
    <AuthCard title="Create your vault">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <input
            className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </div>
        <div>
          <input
            className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <input
            className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
            placeholder="Password"
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          <ul className="mt-2 space-y-1">
            {passwordRequirements.map((r) => (
              <li key={r.label} className={`text-xs ${r.met ? "text-green-600" : "text-slate-400"}`}>
                {r.met ? "✓" : "○"} {r.label}
              </li>
            ))}
          </ul>
        </div>
        {errors.form && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}
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
