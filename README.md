# FYP Web

React + Vite + TypeScript starter for the final year project web app.

## Requirements

- Node.js 20+ (installed: v24)
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload            |
| `npm run build`     | Type-check and build to `dist/`                 |
| `npm run preview`   | Serve the production build locally              |
| `npm run lint`      | Run oxlint                                      |
| `npm run format`    | Format with Prettier                            |
| `npm run typecheck` | Type-check without emitting                     |

## Project structure

```
src/
  main.tsx            App entry — mounts providers (Router, React Query)
  App.tsx             Route table
  components/
    Layout.tsx        Shared nav + page shell (<Outlet />)
  pages/              One file per route
    Home.tsx
    About.tsx
    NotFound.tsx
  lib/
    api.ts            Axios instance (baseURL, auth header)
    queryClient.ts    React Query config
  index.css           Tailwind import + design tokens
```

Path alias: `@/` → `src/` (e.g. `import { api } from '@/lib/api'`).

## Backend

During development, requests to `/api/*` are proxied to `http://localhost:4000`
(see `vite.config.ts`). In production, set `VITE_API_URL` in `.env` to the
deployed API origin. Copy `.env.example` to `.env` to start.

See [STACK.md](STACK.md) for the recommended full stack and database.
