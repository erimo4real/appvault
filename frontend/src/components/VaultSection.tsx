import { FormEvent, useState } from "react";
import type { VaultCategory, VaultEntryDto } from "@appvault/shared";
import {
  useCreateVaultEntryMutation,
  useDeleteVaultEntryMutation,
  useUpdateVaultEntryMutation,
  useVaultEntriesQuery
} from "../features/api.js";

const categories: VaultCategory[] = [
  "database",
  "hosting",
  "auth",
  "storage",
  "email",
  "payment",
  "analytics",
  "domain",
  "repository",
  "other"
];

const providers = [
  "Supabase",
  "pgAdmin",
  "Netlify",
  "Render",
  "Railway",
  "Vercel",
  "Clerk",
  "Stripe",
  "Resend",
  "GitHub",
  "Cloudflare",
  "Other"
];

const emptyForm = {
  provider: "Supabase",
  category: "database" as VaultCategory,
  label: "",
  publicUrl: "",
  dashboardUrl: "",
  username: "",
  secret: "",
  notes: "",
  expiresAt: ""
};

export function VaultSection({ appId }: { appId: string }) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState<VaultEntryDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading, error } = useVaultEntriesQuery({ appId, reveal });
  const [createEntry] = useCreateVaultEntryMutation();
  const [updateEntry] = useUpdateVaultEntryMutation();
  const [deleteEntry] = useDeleteVaultEntryMutation();

  function startEdit(entry: VaultEntryDto) {
    setEditing(entry);
    setForm({
      provider: entry.provider,
      category: entry.category,
      label: entry.label,
      publicUrl: entry.publicUrl ?? "",
      dashboardUrl: entry.dashboardUrl ?? "",
      username: entry.username ?? "",
      secret: "",
      notes: entry.notes ?? "",
      expiresAt: entry.expiresAt?.slice(0, 10) ?? ""
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = {
      ...form,
      publicUrl: form.publicUrl || null,
      dashboardUrl: form.dashboardUrl || null,
      username: form.username || null,
      secret: form.secret || undefined,
      notes: form.notes || null,
      expiresAt: form.expiresAt || null
    };

    if (editing) {
      await updateEntry({ id: editing.id, appId, body }).unwrap();
    } else {
      await createEntry({ appId, body }).unwrap();
    }

    setEditing(null);
    setForm(emptyForm);
  }

  async function copy(value: string | null | undefined, label = "Value") {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(`${label} copied`);
    window.setTimeout(() => setCopied(""), 1600);
  }

  function toggleReveal() {
    if (!reveal) {
      const ok = window.confirm("Reveal encrypted Vault secrets for this app?");
      if (!ok) return;
    }
    setReveal(!reveal);
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Vault</h3>
        <button className="rounded-md border border-line px-3 py-1 text-xs" onClick={toggleReveal}>
          {reveal ? "Hide secrets" : "Reveal secrets"}
        </button>
      </div>
      {copied && <div className="mb-3 rounded-md bg-green-50 p-2 text-xs text-green-700">{copied}</div>}

      <form className="mb-4 grid gap-2 rounded-md border border-line p-3" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-2">
          <select className="field" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
            {providers.map((provider) => <option key={provider}>{provider}</option>)}
          </select>
          <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as VaultCategory })}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <input className="field" placeholder="Label, e.g. Production Supabase" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
        <input className="field" placeholder="Public URL" value={form.publicUrl} onChange={(e) => setForm({ ...form, publicUrl: e.target.value })} />
        <input className="field" placeholder="Dashboard URL" value={form.dashboardUrl} onChange={(e) => setForm({ ...form, dashboardUrl: e.target.value })} />
        <input className="field" placeholder="Username / email" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="field" placeholder={editing ? "New secret, leave blank to keep old" : "Secret / key / password"} value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} />
        <input className="field" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        <textarea className="field min-h-20" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <button className="h-9 rounded-md bg-slate-950 text-sm font-medium text-white">
            {editing ? "Update vault item" : "Add vault item"}
          </button>
          {editing && (
            <button type="button" className="h-9 rounded-md border border-line text-sm" onClick={() => { setEditing(null); setForm(emptyForm); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading && <div className="text-sm text-slate-500">Loading vault...</div>}
      {error && <div className="text-sm text-red-600">Could not load vault.</div>}
      <div className="space-y-2">
        {data?.entries.map((entry) => (
          <div key={entry.id} className="rounded-md border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{entry.label}</div>
                <div className="text-xs capitalize text-slate-500">{entry.provider} - {entry.category}</div>
              </div>
              <div className="flex gap-1">
                <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => startEdit(entry)}>Edit</button>
                <button className="rounded border border-red-200 px-2 py-1 text-xs text-red-600" onClick={() => deleteEntry({ id: entry.id, appId })}>Delete</button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              {entry.publicUrl && <VaultLine label="Public" value={entry.publicUrl} onCopy={(value) => copy(value, "Public URL")} />}
              {entry.dashboardUrl && <VaultLine label="Dashboard" value={entry.dashboardUrl} onCopy={(value) => copy(value, "Dashboard URL")} />}
              {entry.username && <VaultLine label="User" value={entry.username} onCopy={(value) => copy(value, "Username")} />}
              {entry.hasSecret && <VaultLine label="Secret" value={reveal ? entry.secret ?? "" : "••••••••••••"} onCopy={() => reveal && copy(entry.secret, "Secret")} />}
              {entry.expiresAt && <div>Expires: {new Date(entry.expiresAt).toLocaleDateString()}</div>}
              {entry.notes && <div className="pt-1 text-slate-500">{entry.notes}</div>}
            </div>
          </div>
        ))}
        {!data?.entries.length && !isLoading && <div className="rounded-md border border-line p-4 text-sm text-slate-500">No vault records yet.</div>}
      </div>
    </section>
  );
}

function VaultLine({
  label,
  value,
  onCopy
}: {
  label: string;
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="min-w-20 font-medium">{label}:</span>
      <span className="flex-1 truncate">{value}</span>
      <button className="rounded border border-line px-2 py-0.5 text-[11px]" onClick={() => onCopy(value)}>
        Copy
      </button>
    </div>
  );
}
