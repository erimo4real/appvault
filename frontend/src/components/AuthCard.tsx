import type { ReactNode } from "react";

export function AuthCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-slate-950 font-semibold text-white">
            A
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your apps, clients, and subscriptions.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
