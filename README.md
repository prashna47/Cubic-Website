# FYP Web

React + Vite frontend, Express + Prisma API. Auth by **Clerk**, database on
**Neon Postgres**.

## Service access and API protection

Services require a Clerk sign-in and a verified primary email listed in the
**Approved Email** tab of the configured Google Sheet. Enter one email per row
in column A. An `Email` header is optional. Adding a row approves that address;
removing it revokes access. Addresses are matched exactly, ignoring case and
surrounding spaces. Secondary emails do not grant access to another primary email.
Use `APPROVED_USERS_SHEET_NAME` in `server/.env` to change the tab name.

Signed-out visitors are sent to login and returned to their selected service.
Unapproved accounts see “Unverified user cannot access services”. The API enforces
the same policy on every service endpoint, including feedback and downloads.
An unavailable or malformed approval list denies access; it never opens access.
Candidate Directory retains its additional `ADMIN_EMAILS` restriction when set.

Approval reads share an in-flight request and a three-second server cache. Open
service pages recheck approval every 30 seconds and on window focus. Other Sheet
data keeps its existing 60-second cache, with a three-second minimum for manual
refreshes. Job metadata uses bounded caches and shares concurrent lookups.
Authenticated API responses use `Cache-Control: no-store`; browser query data is
cleared on account changes and denied approval. API requests time out after 45
seconds, and authorization/rate-limit failures are not automatically retried.

The API allows 120 requests per minute per IP and 10 service submissions per
minute per authenticated user. Excess requests return 429 and `Retry-After`.
Limits use bounded, per-process memory and reset on server restart. A deployment
with multiple server instances needs a shared limiter store. Proxy headers are
not trusted by default: configure Express proxy trust for your known hosting
proxy before using per-client IP limits behind a reverse proxy.

Approval protects this website and its API. Existing Google Sheet/Drive sharing
permissions still apply to anyone opening the source links directly; do not
treat website approval as making publicly shared source files private.

To verify approved email/account status without printing credentials:

```powershell
npm run build --prefix server
cd server
node scripts/check-approved-users.mjs
```

Security and cache regression checks (from the project root):

```powershell
npm run build --prefix server
node --test server/tests/*.test.mjs
```

## Requirements

- Node.js 20+ (installed: v24)
- A [Clerk](https://clerk.com) application (free tier — 10k monthly users)
- A [Neon](https://neon.tech) Postgres database (free tier — no card)

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
#   set DATABASE_URL + DIRECT_URL   (Neon > Connect > framework "Prisma" — copy both lines)
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

## Database (Neon Postgres — free)

1. Create a project at [neon.tech](https://neon.tech) (sign in with GitHub, no card).
2. **Connect** → framework **Prisma** → copy the two lines it shows into
   `server/.env`: `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
3. `npm --prefix server run prisma:migrate` creates the tables.
4. Change the schema in `server/prisma/schema.prisma`, re-run
   `prisma:migrate` to evolve it.

**Browse the data** with any Postgres GUI — `npm --prefix server run
prisma:studio`, or [DBeaver](https://dbeaver.io) (free): new Postgres
connection, paste the `DIRECT_URL` values (host, database, user, password;
SSL on).

See [STACK.md](STACK.md) for the wider stack and deployment notes.
