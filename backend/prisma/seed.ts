import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);
  const seedEmail = process.env.SEED_EMAIL || "demo@appvault.local";
  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
      email: seedEmail,
      name: seedEmail === "demo@appvault.local" ? "Demo User" : null,
      passwordHash,
      authProvider: "password"
    }
  });

  const apps = [
    {
      name: "Flux Dashboard",
      description: "Real-time analytics dashboard for personal metrics and health tracking.",
      type: "personal" as const,
      status: "building" as const,
      stack: ["React", "TypeScript", "D3.js", "Express"],
      repoUrl: "https://github.com/demo/flux-dashboard",
      milestones: [
        { title: "Design system", completed: true, completedAt: new Date("2026-06-01"), tasks: [{ title: "Color palette", status: "DONE" as const }, { title: "Typography scale", status: "DONE" as const }, { title: "Component library", status: "DONE" as const }] },
        { title: "Data ingestion", dueDate: new Date("2026-07-20"), tasks: [{ title: "API integration", status: "IN_PROGRESS" as const }, { title: "WebSocket setup", status: "TODO" as const }, { title: "Data normalization", status: "TODO" as const }] },
        { title: "Charts & viz", dueDate: new Date("2026-08-15"), tasks: [{ title: "Line chart widget", status: "TODO" as const }, { title: "Pie chart widget", status: "TODO" as const }] }
      ]
    },
    {
      name: "Acme Corp Website",
      description: "Marketing site and blog for Acme Corporation.",
      type: "client" as const,
      status: "live" as const,
      stack: ["Next.js", "Tailwind", "Contentful", "Vercel"],
      clientName: "Acme Corp",
      liveUrl: "https://acme-corp.example.com",
      milestones: [
        { title: "Homepage", completed: true, completedAt: new Date("2026-05-10"), tasks: [{ title: "Hero section", status: "DONE" as const }, { title: "Features grid", status: "DONE" as const }] },
        { title: "Blog engine", completed: true, completedAt: new Date("2026-06-05"), tasks: [{ title: "CMS integration", status: "DONE" as const }, { title: "RSS feed", status: "DONE" as const }] },
        { title: "Analytics & SEO", dueDate: new Date("2026-07-01"), tasks: [{ title: "Google Analytics setup", status: "IN_PROGRESS" as const }, { title: "Sitemap generation", status: "TODO" as const }] }
      ]
    },
    {
      name: "Taskly",
      description: "SaaS task management tool for small teams.",
      type: "saas" as const,
      status: "building" as const,
      stack: ["Vue", "Node", "MongoDB", "Redis"],
      repoUrl: "https://github.com/demo/taskly",
      liveUrl: "https://taskly-preview.vercel.app",
      monthlyCost: "49.00",
      renewalDate: new Date("2026-09-01"),
      milestones: [
        { title: "Auth & teams", completed: true, completedAt: new Date("2026-06-10"), tasks: [{ title: "Email/password login", status: "DONE" as const }, { title: "Google OAuth", status: "DONE" as const }, { title: "Team invite flow", status: "DONE" as const }] },
        { title: "Board view", dueDate: new Date("2026-07-25"), tasks: [{ title: "Drag & drop cards", status: "IN_PROGRESS" as const }, { title: "Column management", status: "TODO" as const }, { title: "Filter & search", status: "TODO" as const }] },
        { title: "Billing", dueDate: new Date("2026-08-30"), tasks: [{ title: "Stripe integration", status: "TODO" as const }, { title: "Subscription plans", status: "TODO" as const }] }
      ]
    },
    {
      name: "GreenLeaf Studio",
      description: "Portfolio site for an architecture firm.",
      type: "client" as const,
      status: "idea" as const,
      stack: ["React", "Framer Motion", "Sanity CMS"],
      clientName: "GreenLeaf Architecture",
      milestones: [
        { title: "Proposal", completed: true, completedAt: new Date("2026-06-15"), tasks: [{ title: "Scope document", status: "DONE" as const }, { title: "Timeline estimate", status: "DONE" as const }] },
        { title: "Design mockups", dueDate: new Date("2026-08-01"), tasks: [{ title: "Homepage wireframes", status: "TODO" as const }, { title: "Project gallery layout", status: "TODO" as const }] }
      ]
    },
    {
      name: "Pocket Budget",
      description: "Personal expense tracking app with monthly reports.",
      type: "personal" as const,
      status: "live" as const,
      stack: ["Flutter", "Firebase", "RevenueCat"],
      liveUrl: "https://pocketbudget.app",
      milestones: [
        { title: "Core tracking", completed: true, completedAt: new Date("2026-04-01"), tasks: [{ title: "Add expense form", status: "DONE" as const }, { title: "Category picker", status: "DONE" as const }, { title: "Monthly summary", status: "DONE" as const }] },
        { title: "Reports & export", completed: true, completedAt: new Date("2026-05-15"), tasks: [{ title: "CSV export", status: "DONE" as const }, { title: "Spending charts", status: "DONE" as const }] },
        { title: "Sync & backup", dueDate: new Date("2026-07-10"), tasks: [{ title: "Cloud sync", status: "IN_PROGRESS" as const }, { title: "Auto backup", status: "TODO" as const }] }
      ]
    }
  ];

  for (const appData of apps) {
    const { milestones, ...appFields } = appData;
    const app = await prisma.app.upsert({
      where: { id: `seed-${appData.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${appData.name.toLowerCase().replace(/\s+/g, "-")}`,
        userId: user.id,
        ...appFields,
        activityLogs: {
          create: { userId: user.id, action: "app_created", metadata: { seeded: true } }
        }
      }
    });

    for (const milestone of milestones) {
      const { tasks, ...milestoneFields } = milestone;
      const created = await prisma.milestone.create({
        data: {
          appId: app.id,
          ...milestoneFields
        }
      });

      if (tasks.length > 0) {
        await prisma.task.createMany({
          data: tasks.map((task, i) => ({
            milestoneId: created.id,
            sortOrder: i,
            ...task
          }))
        });
      }

      if (milestone.completed) {
        await prisma.activityLog.create({
          data: {
            appId: app.id,
            userId: user.id,
            action: "milestone_completed",
            metadata: { milestoneId: created.id, milestone: milestone.title }
          }
        });
      }
    }

    for (const milestone of milestones) {
      for (const task of milestone.tasks) {
        if (task.status === "DONE") {
          await prisma.activityLog.create({
            data: {
              appId: app.id,
              userId: user.id,
              action: "task_completed",
              metadata: { task: task.title }
            }
          });
        }
      }
    }
  }

  console.log(`Seed complete: demo@appvault.local / password123 — ${apps.length} apps created`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
