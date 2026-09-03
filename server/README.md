# FYP Web — API server

Express + TypeScript + Prisma. Auth is handled by **Clerk** (this server only
verifies Clerk session tokens); the database is **PostgreSQL** (Railway).

## Setup

```bash
cd server
npm install
cp .env.example .env        # fill in DATABASE_URL + Clerk keys
npm run prisma:migrate      # create tables
npm run dev                  # http://localhost:4000
```

From the project root, `npm run dev:all` runs this + the frontend together.

## Environment (`.env`)

| Var                           | Required | Notes                                                   |
| ----------------------------- | -------- | ----------------------------------------------------- |
| `DATABASE_URL`                | yes      | Railway → Postgres → Connect → Postgres Connection URL. |
| `CLERK_PUBLISHABLE_KEY`       | yes      | Clerk dashboard → API keys.                             |
| `CLERK_SECRET_KEY`            | yes      | Clerk dashboard → API keys. Server-only, keep secret.   |
| `CLERK_WEBHOOK_SIGNING_SECRET`| no       | Enables `/api/webhooks/clerk`. See below.               |
| `PORT`                        | no       | Default `4000`.                                         |
| `CLIENT_URL`                  | no       | CORS allow-origin. Default `http://localhost:5173`.     |

## Endpoints

| Method | Path                   | Auth        | Returns                     |
| ------ | ---------------------- | ----------- | --------------------------- |
| GET    | `/api/health`          | none        | `{ status, webhookEnabled }`|
| GET    | `/api/me`              | Clerk token | `{ user }` — local row, created from Clerk on first call |
| POST   | `/api/webhooks/clerk`  | svix sig    | syncs `User` on `user.created/updated/deleted` |

Protected routes use Clerk's `requireAuth()`; the frontend attaches the token as
`Authorization: Bearer <token>` (see `src/components/ApiAuthBridge.tsx`).

## User sync

The `User` table mirrors Clerk (id, email, name, avatar). Two mechanisms:

- **Lazy** — `getOrCreateUser()` in `src/lib/users.ts` creates the row on the
  user's first authenticated request. Always on.
- **Webhook** — `POST /api/webhooks/clerk` keeps email/name in sync and handles
  account deletion. Recommended for production.

### Enabling the webhook

1. Deploy the API (or expose it with `ngrok http 4000` for local testing).
2. Clerk dashboard → **Webhooks** → **Add Endpoint**
   - URL: `https://<your-api>/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
3. Copy the endpoint's **Signing Secret** → `.env`
   `CLERK_WEBHOOK_SIGNING_SECRET`.
4. Restart the server (`/api/health` will show `"webhookEnabled": true`).

## Common commands

| Command                   | What it does                     |
| ------------------------- | -------------------------------- |
| `npm run dev`             | Start with auto-reload (tsx)      |
| `npm run build`           | Compile to `dist/`               |
| `npm start`               | Run the compiled server           |
| `npm run prisma:migrate`  | Create/apply a migration          |
| `npm run prisma:studio`   | Open the DB browser               |

## Deployment (Railway)

The API and the Postgres database can live in the same Railway project.

1. New service → deploy from the repo, root directory `server/`.
2. Build: `npm install && npm run build && npx prisma migrate deploy`
   Start: `npm start`
3. Variables: `DATABASE_URL` (reference the Postgres service),
   `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
   `CLERK_WEBHOOK_SIGNING_SECRET`, `CLIENT_URL` (your deployed frontend URL).
