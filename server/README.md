# FYP Web — API server

Express + TypeScript + Prisma. JWT auth with email/password and Google Sign-In.

## Setup

```bash
cd server
npm install
cp .env.example .env        # then edit .env (a JWT_SECRET is required)
npm run prisma:migrate      # creates the SQLite database
npm run dev                  # http://localhost:4000
```

The frontend's Vite dev server proxies `/api` to this server (port 4000), so run
both while developing. From the project root: `npm run dev:all`.

## Environment (`.env`)

| Var                | Required | Notes                                                                                          |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`     | yes      | `file:./dev.db` for SQLite. Postgres URL to switch.                                            |
| `JWT_SECRET`       | yes      | Long random string. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN`   | no       | Default `7d`.                                                                                  |
| `GOOGLE_CLIENT_ID` | no       | Enables `POST /api/auth/google`. Blank = Google disabled.                                      |
| `PORT`             | no       | Default `4000`.                                                                                |
| `CLIENT_URL`       | no       | CORS allow-origin. Default `http://localhost:5173`.                                            |

## Endpoints

| Method | Path                 | Body                               | Returns                     |
| ------ | -------------------- | ---------------------------------- | --------------------------- |
| GET    | `/api/health`        | —                                  | `{ status, googleEnabled }` |
| POST   | `/api/auth/register` | `{ name, email, password }`        | `{ token, user }`           |
| POST   | `/api/auth/login`    | `{ email, password }`              | `{ token, user }`           |
| POST   | `/api/auth/google`   | `{ credential }` (Google ID token) | `{ token, user }`           |
| GET    | `/api/auth/me`       | — (Bearer token)                   | `{ user }`                  |

`token` is a JWT — the frontend stores it in `localStorage` and sends it as
`Authorization: Bearer <token>`.

## Google Sign-In setup

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`
     (add your production URL later)
3. Copy the **Client ID** into:
   - `server/.env` → `GOOGLE_CLIENT_ID`
   - project root `.env` → `VITE_GOOGLE_CLIENT_ID` (same value)
4. Restart both dev servers.

The frontend uses Google Identity Services to get an ID token and posts it to
`/api/auth/google`; the server verifies it with `google-auth-library` and
creates or links the user.

## Switching to PostgreSQL

1. `prisma/schema.prisma` → `provider = "postgresql"`
2. `.env` → `DATABASE_URL="postgresql://user:pass@localhost:5432/fyp?schema=public"`
3. `rm -rf prisma/migrations` (dev only) then `npm run prisma:migrate`

## Common commands

| Command                  | What it does                       |
| ------------------------ | ---------------------------------- |
| `npm run dev`            | Start with auto-reload (tsx watch) |
| `npm run build`          | Compile TypeScript to `dist/`      |
| `npm start`              | Run the compiled server            |
| `npm run prisma:migrate` | Create/apply a migration           |
| `npm run prisma:studio`  | Open Prisma Studio (DB browser)    |
