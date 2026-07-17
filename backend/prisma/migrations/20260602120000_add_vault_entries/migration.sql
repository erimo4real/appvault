CREATE TYPE "VaultCategory" AS ENUM ('database', 'hosting', 'auth', 'storage', 'email', 'payment', 'analytics', 'domain', 'repository', 'other');

CREATE TABLE "vault_entries" (
  "id" TEXT NOT NULL,
  "app_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "category" "VaultCategory" NOT NULL,
  "label" TEXT NOT NULL,
  "public_url" TEXT,
  "dashboard_url" TEXT,
  "username" TEXT,
  "secret_encrypted" TEXT,
  "notes" TEXT,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vault_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vault_entries_app_id_idx" ON "vault_entries"("app_id");
CREATE INDEX "vault_entries_user_id_idx" ON "vault_entries"("user_id");

ALTER TABLE "vault_entries" ADD CONSTRAINT "vault_entries_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_entries" ADD CONSTRAINT "vault_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
