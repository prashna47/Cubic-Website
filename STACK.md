# Tech stack

Production stack for the site. What's wired up in this repo is marked ✅.

## Frontend

| Concern      | Choice                    | Why                                                       |
| ------------ | ------------------------- | ------------------------------------------------------- |
| Build tool   | **Vite** ✅               | Fast dev server, minimal config, standard for React SPAs. |
| Language     | **TypeScript** ✅         | Catches errors before runtime; shared types with the API. |
| UI library   | **React 19** ✅           | —                                                        |
| Routing      | **React Router 7** ✅     | De-facto routing for Vite SPAs.                          |
| Server state | **TanStack Query** ✅     | Caching, loading/error states, refetching.               |
| HTTP         | **Axios** ✅              | Interceptors for the auth token + base URL.              |
| Styling      | **Tailwind CSS v4** ✅    | Fast to build with, tokens in `src/index.css`.           |
| Auth UI      | **@clerk/clerk-react** ✅ | Prebuilt, accessible sign-in / user-button components.   |
| Components   | **shadcn/ui** (add later) | Copy-paste components on Tailwind + Radix.               |
| Forms        | **React Hook Form + Zod** | Minimal re-renders; Zod schema = validation + types.     |
| Icons        | **lucide-react**          | Tree-shakeable icon set.                                 |

```bash
npm install react-hook-form zod @hookform/resolvers lucide-react
npx shadcn@latest init
```

## Backend ✅

| Concern    | Choice                  | Why                                              |
| ---------- | ----------------------- | ---------------------------------------------- |
| Runtime    | **Node + Express + TS** | Small, well-understood, easy to host.           |
| ORM        | **Prisma**              | Type-safe queries, migrations, readable schema. |
| Validation | **Zod**                 | Same schemas as the frontend.                   |

The API verifies Clerk session tokens (`clerkMiddleware()` / `requireAuth()`);
it does not handle passwords itself.

## Auth — Clerk ✅

Managed auth. Clerk owns: password hashing, email verification, password reset,
OAuth (Google), MFA, session tokens, bot/breach protection. This app keeps a
`User` row per Clerk account (`clerkId`, `email`, `name`, `avatarUrl`) so app
data can foreign-key to a user; it's synced from Clerk lazily and via webhook.

**Before launch:** replace Clerk's shared dev Google credentials with your own
Google OAuth client, and set a production Clerk instance (separate keys).

## Database — PostgreSQL on Neon ✅

- Relational — maps directly from an ERD (users + related tables, foreign keys).
- **Neon** free tier: no credit card, ~0.5 GB, scales to zero when idle.
- `DATABASE_URL` (pooled) + `DIRECT_URL` (direct, for migrations) — Neon's
  "Prisma" connect tab gives both.
- `server/prisma/schema.prisma` is the source of truth; `prisma migrate` evolves it.
- Browse it with `prisma:studio` or **DBeaver** (free GUI) — DBeaver is a client,
  not a database; it connects to this same Postgres.
- Local option: `docker run --name fyp-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:17`

### When another store fits better

| Instead of Postgres | If…                                                                 |
| ------------------- | ----------------------------------------------------------------- |
| **MongoDB**         | Records are self-contained documents with few relations. Note: Prisma + Mongo loses `migrate` (push-only). |
| Redis (alongside)   | Caching, rate-limit counters, job queues — not primary storage.    |

## Deployment

| Part     | Where                                                              |
| -------- | --------------------------------------------------------------- |
| Frontend | **Netlify** or **Cloudflare Pages** — free tier allows commercial use (Vercel's Hobby tier does not). Auto-deploy on push; set `VITE_*` env vars. |
| API      | **Render** / **Fly** / **Railway** — deploy `server/`, run `npm run prisma:deploy` on release. |
| Database | **Neon Postgres** — free tier, separate from the API host.         |
| Auth     | **Clerk** — create a production instance; point DNS/allowed origins at the live frontend. |

## Things to do before "released"

- [ ] Own Google OAuth client in Clerk (not the shared dev one)
- [ ] Clerk **production** instance + separate keys
- [ ] Clerk webhook configured (`CLERK_WEBHOOK_SIGNING_SECRET`) for user sync + deletion
- [ ] Lock `CLIENT_URL` / CORS to the real domain; HTTPS everywhere
- [ ] Rate limiting on the API (e.g. `express-rate-limit`)
- [ ] Error tracking (Sentry) and uptime monitoring
- [ ] DB backups enabled on Railway
- [ ] Privacy policy + account-deletion path (Clerk handles the auth side)

## Build order

1. Model the domain in `schema.prisma`, migrate.
2. Confirm the auth pipeline (sign in → `/api/me` returns your DB row).
3. Build one full feature (list / create / edit / delete) as a template.
4. Repeat; polish UI last.
