CREATE TYPE "AppType" AS ENUM ('personal', 'client', 'saas');
CREATE TYPE "AppStatus" AS ENUM ('idea', 'building', 'live', 'archived');
CREATE TYPE "ActivityAction" AS ENUM ('app_created', 'status_changed', 'milestone_added', 'milestone_completed', 'field_edited', 'app_archived');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "avatar_url" TEXT,
  "password_hash" TEXT,
  "auth_provider" TEXT NOT NULL DEFAULT 'password',
  "provider_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "apps" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "AppType" NOT NULL,
  "status" "AppStatus" NOT NULL DEFAULT 'idea',
  "stack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "repo_url" TEXT,
  "live_url" TEXT,
  "client_name" TEXT,
  "monthly_cost" DECIMAL(10,2),
  "renewal_date" TIMESTAMP(3),
  "notes" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "milestones" (
  "id" TEXT NOT NULL,
  "app_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "due_date" TIMESTAMP(3),
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_log" (
  "id" TEXT NOT NULL,
  "app_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "action" "ActivityAction" NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "apps_user_id_idx" ON "apps"("user_id");
CREATE INDEX "milestones_app_id_idx" ON "milestones"("app_id");
CREATE INDEX "activity_log_app_id_idx" ON "activity_log"("app_id");
CREATE INDEX "activity_log_user_id_idx" ON "activity_log"("user_id");

ALTER TABLE "apps" ADD CONSTRAINT "apps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
