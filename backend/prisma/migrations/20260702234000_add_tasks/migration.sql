-- Add auto_created column to milestones
ALTER TABLE "milestones" ADD COLUMN "auto_created" BOOLEAN NOT NULL DEFAULT false;

-- Create tasks table
CREATE TABLE "tasks" (
  "id" TEXT NOT NULL,
  "milestone_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tasks_milestone_id_idx" ON "tasks"("milestone_id");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new activity action enum values
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'task_added';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'task_completed';
