# Recommended tech stack — FYP web app

This is a pragmatic stack for a final-year project: modern, widely documented,
free to run, and easy to defend in a viva. What's already set up in this repo is
marked ✅.

## Frontend (this repo)

| Concern          | Choice                        | Why                                                                 |
| ---------------- | ----------------------------- | ------------------------------------------------------------------- |
| Build tool       | **Vite** ✅                   | Fast dev server, tiny config, the standard for React SPAs.         |
| Language         | **TypeScript** ✅             | Catches bugs before runtime; examiners expect it.                  |
| UI library       | **React 19** ✅               | Requested.                                                         |
| Routing          | **React Router 7** ✅         | De-facto routing for Vite SPAs.                                    |
| Server state     | **TanStack Query** ✅         | Caching, loading/error states, refetching — no manual `useEffect`. |
| HTTP             | **Axios** ✅                  | Interceptors for auth token, base URL.                             |
| Styling          | **Tailwind CSS v4** ✅        | Fast to build with, no CSS file sprawl.                            |
| Components       | **shadcn/ui** (add later)     | Copy-paste accessible components built on Tailwind + Radix.        |
| Forms            | **React Hook Form + Zod**     | Minimal re-renders; Zod schema doubles as validation + TS types.   |
| Icons            | **lucide-react**              | Clean, tree-shakeable icon set.                                    |

Add the optional ones when you need them:

```bash
npm install react-hook-form zod @hookform/resolvers lucide-react
npx shadcn@latest init
```

## Backend

Pick **one** of these. Both pair cleanly with the frontend above.

### Option A — Node API you write (most control, best for learning)

| Concern     | Choice                         | Why                                                    |
| ----------- | ------------------------------ | ----------------------------------------------------- |
| Runtime     | **Node.js + Express**          | Simplest to explain; huge amount of tutorials.       |
|             | _or_ **Fastify**               | Same idea, faster, schema validation built in.       |
| Language    | **TypeScript**                 | Share types with the frontend.                       |
| ORM         | **Prisma**                     | Type-safe queries, readable schema file, migrations. |
| Auth        | **JWT** (`jsonwebtoken`) + `bcrypt` | Standard, self-contained, easy to demo.        |
| Validation  | **Zod**                        | Reuse schemas from the frontend.                     |

The dev proxy in `vite.config.ts` already points `/api` at `http://localhost:4000`,
so run this API on port 4000.

### Option B — Backend-as-a-service (fastest to a working app)

**Supabase** — hosted PostgreSQL + auth + file storage + auto-generated REST/realtime
APIs. You write almost no server code. Use `@supabase/supabase-js` from the React app.
Good when the project is about the frontend/features, not about building an API.

## Database

**PostgreSQL** is the recommendation for this project:

- Relational — your ERD (users, appointments/quests, items, etc.) maps directly to tables with foreign keys.
- Free, open-source, universally accepted in academia.
- Works with Prisma (Option A) and _is_ the database inside Supabase (Option B).

Hosting (all have free tiers): **Supabase**, **Neon**, or **Railway**. For local
dev you can run Postgres in Docker:

```bash
docker run --name fyp-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:17
```

### When to choose something else

| Instead of Postgres | If…                                                                         |
| ------------------- | -------------------------------------------------------------------------- |
| **MongoDB**         | Your data is document-shaped and schema-flexible, and you have few relations. Use with Mongoose. |
| **SQLite**          | Single-user, offline, or you want zero setup for a demo. Prisma supports it with a one-line change. |

## Deployment

| Part           | Where                                   |
| -------------- | -------------------------------------- |
| Frontend (SPA) | **Vercel** or **Netlify** — connect the GitHub repo, auto-deploy on push. |
| Node API       | **Railway** or **Render** — free tier, deploys from GitHub. |
| Database       | **Supabase** / **Neon** (managed Postgres). |

## Suggested build order

1. Model the database (you have an ERD — turn it into a Prisma schema or Supabase tables).
2. Build auth (register / login) end to end — proves the whole pipeline works.
3. Build one full feature (list + create + edit + delete) as a template.
4. Repeat for the rest; polish UI last.
