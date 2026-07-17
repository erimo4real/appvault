import type { VaultEntry } from "@prisma/client";
import { decryptSecret } from "./crypto.js";

export function serializeVaultEntry(entry: VaultEntry, reveal = false) {
  return {
    id: entry.id,
    appId: entry.appId,
    userId: entry.userId,
    provider: entry.provider,
    category: entry.category,
    label: entry.label,
    publicUrl: entry.publicUrl,
    dashboardUrl: entry.dashboardUrl,
    username: entry.username,
    hasSecret: Boolean(entry.secretEncrypted),
    secret: reveal ? decryptSecret(entry.secretEncrypted) : undefined,
    notes: entry.notes,
    expiresAt: entry.expiresAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  };
}
