import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../components/AuthCard.js";
import { useForgotPasswordMutation } from "../features/api.js";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await forgotPassword({ email }).unwrap();
    setMessage(result.message);
    setResetToken(result.resetToken ?? "");
  }

  return (
    <AuthCard title="Reset password">
      <form className="space-y-4" onSubmit={submit}>
        <input
          className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-slate-400"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button className="h-11 w-full rounded-md bg-slate-950 text-sm font-medium text-white" disabled={isLoading}>
          {isLoading ? "Creating reset link..." : "Create reset link"}
        </button>
      </form>
      {message && <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
      {resetToken && (
        <div className="mt-4 rounded-md border border-line p-3 text-sm">
          <div className="font-medium">Local dev reset token</div>
          <div className="mt-2 break-all text-slate-600">{resetToken}</div>
          <Link className="mt-3 inline-block font-medium text-slate-950" to={`/reset-password?token=${resetToken}`}>
            Continue to reset form
          </Link>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link className="font-medium text-slate-950" to="/login">Back to login</Link>
      </p>
    </AuthCard>
  );
}
