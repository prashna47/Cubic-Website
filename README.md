# FYP Web

React + Vite frontend, Express + Prisma API. Auth by **Clerk**, database on
**Railway Postgres**.

## Requirements

- Node.js 20+ (installed: v24)
- A [Clerk](https://clerk.com) application (free)
- A [Railway](https://railway.app) Postgres database (free tier)

## Getting started

```bash
# 1. Install
npm install
npm --prefix server install

# 2. Frontend env
cp .env.example .env
#   set VITE_CLERK_PUBLISHABLE_KEY  (Clerk dashboard > API keys)

# 3. Backend env
cp server/.env.example server/.env
#   set DATABASE_URL           (Railway > Postgres > Connect > Postgres Connection URL)
#   set CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY   (Clerk dashboard > API keys)
#   set CLERK_WEBHOOK_SIGNING_SECRET   (optional now — see server/README.md)

# 4. Create the database tables
npm --prefix server run prisma:migrate

# 5. Run both servers
npm run dev:all
```

- Frontend: http://localhost:5173
- API: http://localhost:4000 (frontend proxies `/api` to it)

Without `VITE_CLERK_PUBLISHABLE_KEY` the app shows a setup notice instead of
loading.

## Authentication (Clerk)

Clerk owns identity — passwords, email verification, password reset, OAuth, MFA,
session security. This app stores only a small `User` row per Clerk account so
app data can reference a user.

**Set up:**

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. **User & Authentication → Email, Phone, Username**: enable **Email** +
   **Password**.
3. **SSO Connections**: enable **Google** (Clerk provides dev credentials; add
   your own Google OAuth client before production).
4. **API keys**: copy the **Publishable key** → `.env`
   (`VITE_CLERK_PUBLISHABLE_KEY`) and `server/.env`
   (`CLERK_PUBLISHABLE_KEY`); copy the **Secret key** → `server/.env`
   (`CLERK_SECRET_KEY`).
5. Restart the dev servers.

**How it's wired:**

| Piece | File |
| ----- | ---- |
| Provider + React Router integration | [`src/main.tsx`](src/main.tsx) |
| Sign-in / sign-up pages (Clerk components) | [`src/pages/Login.tsx`](src/pages/Login.tsx), [`src/pages/SignUp.tsx`](src/pages/SignUp.tsx) |
| Header avatar: `<UserButton />` when signed in, custom dropdown when signed out | [`src/components/ProfileMenu.tsx`](src/components/ProfileMenu.tsx) |
| Sends the Clerk token on every API call | [`src/components/ApiAuthBridge.tsx`](src/components/ApiAuthBridge.tsx) + [`src/lib/api.ts`](src/lib/api.ts) |
| API verifies the token | `clerkMiddleware()` in [`server/src/index.ts`](server/src/index.ts) |
| Local user row synced from Clerk | [`server/src/lib/users.ts`](server/src/lib/users.ts), webhook in [`server/src/routes/webhooks.ts`](server/src/routes/webhooks.ts) |

## Scripts (root)

| Command             | What it does                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Frontend dev server                             |
| `npm run server`    | Backend dev server                              |
| `npm run dev:all`   | Both together                                   |
| `npm run build`     | Type-check + build the frontend to `dist/`      |
| `npm run preview`   | Serve the production frontend build             |
| `npm run lint`      | oxlint                                          |
| `npm run format`    | Prettier                                        |

Backend scripts and the **Clerk webhook** setup are in
[`server/README.md`](server/README.md).

## Project structure

```
src/                     Frontend (React)
  main.tsx               ClerkProvider + Router + React Query
  App.tsx               Routes (+ <ApiAuthBridge/>)
  components/
    Layout.tsx           Nav shell; hosts <ProfileMenu/>
    ProfileMenu.tsx       Signed out: custom hover/click dropdown → /login
                          Signed in:  Clerk <UserButton/>
    ApiAuthBridge.tsx     Feeds the Clerk token into axios
  pages/  Home About Login SignUp NotFound
  lib/    api.ts  queryClient.ts

server/                  Backend (Express + Prisma)
  src/
    index.ts             App, CORS, clerkMiddleware, routes
    routes/
      users.ts            GET /api/me  (Clerk-protected)
      webhooks.ts         POST /api/webhooks/clerk  (user sync)
    lib/    users.ts (Clerk↔DB sync)  prisma.ts
    middleware/auth.ts    requireAuth re-export + helper
    env.ts               Validated environment
  prisma/schema.prisma    User { clerkId, email, name, avatarUrl }
```

Path alias: `@/` → `src/`.

## Database (Railway Postgres)

1. New project on [railway.app](https://railway.app) → **Add → Database →
   PostgreSQL**.
2. Postgres service → **Connect** → copy **Postgres Connection URL** →
   `server/.env` `DATABASE_URL`.
3. `npm --prefix server run prisma:migrate` creates the tables.
4. Change the schema in `server/prisma/schema.prisma`, re-run
   `prisma:migrate` to evolve it.

See [STACK.md](STACK.md) for the wider stack and deployment notes.
