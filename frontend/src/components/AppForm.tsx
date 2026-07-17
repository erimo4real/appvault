import { FormEvent, useState } from "react";
import type { AppDto, AppStatus, AppType } from "@appvault/shared";

interface Props {
  initial?: Partial<AppDto>;
  compact?: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export function AppForm({ initial, compact, onSubmit }: Props) {
  const [values, setValues] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "personal",
    status: initial?.status ?? "idea",
    stack: initial?.stack?.join(", ") ?? "",
    repoUrl: initial?.repoUrl ?? "",
    liveUrl: initial?.liveUrl ?? "",
    clientName: initial?.clientName ?? "",
    monthlyCost: initial?.monthlyCost?.toString() ?? "",
    renewalDate: initial?.renewalDate?.slice(0, 10) ?? "",
    notes: initial?.notes ?? ""
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      ...values,
      stack: values.stack
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      monthlyCost: values.monthlyCost ? Number(values.monthlyCost) : null,
      renewalDate: values.renewalDate || null
    });
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <input className="field" placeholder="Name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
      {!compact && (
        <textarea className="field min-h-20" placeholder="Description" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <select className="field" value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value as AppType })}>
          <option value="personal">Personal</option>
          <option value="client">Client</option>
          <option value="saas">SaaS</option>
        </select>
        <select className="field" value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as AppStatus })}>
          <option value="idea">Idea</option>
          <option value="building">Building</option>
          <option value="live">Live</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <input className="field" placeholder="Stack: React, Node, Prisma" value={values.stack} onChange={(e) => setValues({ ...values, stack: e.target.value })} />
      <input className="field" placeholder="Repo URL" value={values.repoUrl} onChange={(e) => setValues({ ...values, repoUrl: e.target.value })} />
      <input className="field" placeholder="Live URL" value={values.liveUrl} onChange={(e) => setValues({ ...values, liveUrl: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input className="field" placeholder="Client" value={values.clientName} onChange={(e) => setValues({ ...values, clientName: e.target.value })} />
        <input className="field" placeholder="Monthly cost" type="number" min="0" value={values.monthlyCost} onChange={(e) => setValues({ ...values, monthlyCost: e.target.value })} />
      </div>
      <input className="field" type="date" value={values.renewalDate} onChange={(e) => setValues({ ...values, renewalDate: e.target.value })} />
      <textarea className="field min-h-20" placeholder="Notes" value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} />
      <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white">
        {initial?.id ? "Save changes" : "Create app"}
      </button>
    </form>
  );
}
