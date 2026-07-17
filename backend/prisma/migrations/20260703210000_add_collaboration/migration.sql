CREATE TABLE "invitations" (
  "id" TEXT NOT NULL,
  "app_id" TEXT NOT NULL,
  "invited_by_id" TEXT NOT NULL,
  "invited_email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invitations_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE,
  CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id")
);

CREATE TABLE "collaborators" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "app_id" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'editor',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "collaborators_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE,
  CONSTRAINT "collaborators_user_id_app_id_key" UNIQUE ("user_id", "app_id")
);

CREATE TABLE "share_links" (
  "id" TEXT NOT NULL,
  "app_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "share_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "share_links_token_key" UNIQUE ("token"),
  CONSTRAINT "share_links_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE
);

CREATE INDEX "invitations_app_id_idx" ON "invitations"("app_id");
CREATE INDEX "invitations_invited_email_idx" ON "invitations"("invited_email");
CREATE INDEX "collaborators_app_id_idx" ON "collaborators"("app_id");
CREATE INDEX "share_links_app_id_idx" ON "share_links"("app_id");