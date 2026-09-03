# FYP Web

Final year project web app. React + Vite frontend, Express + Prisma API.

## Requirements

- Node.js 20+ (installed: v24)
- npm 10+

## Getting started

```bash
# 1. Frontend deps
npm install

# 2. Backend deps + database
cd server
npm install
cp .env.example .env          # edit .env — JWT_SECRET is required
npm run prisma:migrate        # creates server/dev.db (SQLite)
cd ..

# 3. Run both servers together
npm run dev:all
```

- Frontend: http://localhost:5173
- API: http://localhost:4000 (frontend proxies `/api` to it)

You can also run them separately: `npm run dev` (frontend) and
`npm run server` (backend), in two terminals.

## Scripts (root)

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Frontend dev server with hot reload             |
| `npm run server`    | Backend dev server (proxies to `server/`)       |
| `npm run dev:all`   | Both of the above, together                     |
| `npm run build`     | Type-check and build the frontend to `dist/`    |
| `npm run preview`   | Serve the production frontend build             |
| `npm run lint`      | Run oxlint                                      |
| `npm run format`    | Format with Prettier                            |

See [`server/README.md`](server/README.md) for backend scripts and the
**Google Sign-In setup** steps.

## Project structure

```
src/                    Frontend (React)
  main.tsx              Mounts providers: Router, React Query, AuthProvider
  App.tsx              Route table
  components/
    Layout.tsx          Nav + page shell; hosts <ProfileMenu />
    ProfileMenu.tsx      Avatar button + hover/click dropdown (login / logout)
    GoogleSignInButton.tsx
  context/
    AuthContext.tsx      useAuth(): user, login, register, logout
  pages/
    Home.tsx  About.tsx  Login.tsx  NotFound.tsx
  lib/
    api.ts               Axios instance (baseURL + Bearer token)
    queryClient.ts
  types/                 Shared types (auth, google)
  index.css              Tailwind import + design tokens

server/                 Backend (Express + Prisma)
  src/
    index.ts             App, CORS, routes
    routes/auth.ts        register / login / google / me
    middleware/auth.ts    requireAuth (Bearer JWT)
    lib/                  prisma, jwt
    env.ts               Validated environment
  prisma/schema.prisma    User model
```

Path alias: `@/` → `src/`.

## Authentication

- Email/password (bcrypt-hashed) and Google Sign-In.
- The API returns a JWT; the frontend keeps it in `localStorage` and sends it as
  `Authorization: Bearer <token>`. On load, `AuthProvider` calls `/api/auth/me`
  to restore the session.
- Google login is optional — set `GOOGLE_CLIENT_ID` (backend) and
  `VITE_GOOGLE_CLIENT_ID` (frontend) to enable it. Steps in `server/README.md`.

## Database

SQLite by default (`server/dev.db`) — zero setup. To move to PostgreSQL, see
"Switching to PostgreSQL" in `server/README.md`.

See [STACK.md](STACK.md) for the full recommended stack.
