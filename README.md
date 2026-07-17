# AppVault

AppVault is a full-stack portfolio manager for developers, freelancers, and small teams. It tracks apps, client projects, SaaS costs, milestones, alerts, and activity logs from one protected dashboard.

## Stack

- React, Vite, TypeScript, Tailwind CSS
- Redux Toolkit and RTK Query
- Node.js, Express, TypeScript
- PostgreSQL, Prisma ORM
- Custom JWT auth stored in HTTP-only cookies

## Local Setup

From `C:\Users\erimo\Documents\Codex\2026-05-28\hello\appvault`:

```bash
npm install
copy .env.example backend\.env
copy frontend\.env.example frontend\.env
docker compose up -d
npm run db:migrate
npm run dev:api
npm run dev:web
```

Open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/health`
- Prisma Studio: `npm run db:studio`

If PowerShell blocks `npm.ps1`, run commands as `npm.cmd install`, `npm.cmd run dev:api`, or use Command Prompt.

## Auth Persistence

The backend sets a 7-day `HttpOnly` cookie named `appvault_token` on login/register. The frontend never stores JWTs in localStorage. On every app refresh, React calls `GET /api/auth/me` with `credentials: "include"` and restores the Redux auth state for all protected pages.

LocalStorage is only used for harmless UI preferences such as sidebar collapsed state, dashboard filter, and sort order.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/oauth`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/apps`
- `POST /api/apps`
- `GET /api/apps/:id`
- `PATCH /api/apps/:id`
- `DELETE /api/apps/:id` soft archives an app
- `GET /api/apps/:id/milestones`
- `POST /api/apps/:id/milestones`
- `PATCH /api/milestones/:id`
- `DELETE /api/milestones/:id`
- `GET /api/apps/:id/activity`
- `GET /api/dashboard`
- `GET /api/apps/:id/vault`
- `POST /api/apps/:id/vault`
- `PATCH /api/vault/:id`
- `DELETE /api/vault/:id`

## Deployment Notes

Backend environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `NODE_ENV=production`
- `PORT`
- `CLIENT_ORIGIN`
- `COOKIE_NAME`

Frontend environment variables:

- `VITE_API_URL`

For production across separate domains, cookies are sent with `Secure=true` and `SameSite=None`. Configure HTTPS on both Vercel and Railway.

## Vault

Each app has a Vault section for full service records such as Supabase, pgAdmin, Netlify, Render, Railway, Vercel, domains, auth providers, and payment services. Secret values are encrypted in PostgreSQL with AES-256-GCM using `ENCRYPTION_KEY`.

Use a stable production `ENCRYPTION_KEY`. If you change it after storing Vault secrets, those existing encrypted secrets cannot be decrypted.
