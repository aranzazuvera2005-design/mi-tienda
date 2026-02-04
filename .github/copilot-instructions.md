**Repo Overview**
- Framework: Next.js (App Router, `app/` directory).
- Purpose: storefront app using Supabase for auth/data and Prisma for optional DB work.
- Major folders: `src/app` (pages + server routes), `src/components`, `src/context`, `src/lib` (Prisma client), `prisma/` (schema).

**Big picture / architecture**
- Frontend: React + Next App Router. Routes live in `src/app/*`. Many pages are client components (`'use client'`).
- Server/API: Server routes under `src/app/api/*` (e.g. `api/search`, `api/ping-supabase`, `api/admin/*`). Use these for privileged operations.
- Auth & DB: Supabase JS (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for client operations; server-only operations use `SUPABASE_SERVICE_ROLE_KEY` and server routes (see `src/app/api/admin/create-user/route.ts`).
- Prisma: present (generated client in `node_modules/@prisma/client`), `prisma/schema.prisma` for migrations; `postinstall` runs `prisma generate`.

**Key files to inspect when making changes**
- `src/lib/prisma.ts` — Prisma client setup.
- `src/app/api/*/route.ts` — server endpoints and examples of using service-role keys.
- `src/context/CartContext.tsx` and `src/context/ToastContext.tsx` — app-wide patterns for state and toasts (watch for setState-in-render issues and deferred updates).
- `src/app/admin/*` — admin UI (clientes, inventario, pedidos) showing client+server interactions and defensive Supabase usage.
- `src/components/AgregarAlCarritoBtn.tsx`, `SearchProductos.tsx`, `Header.tsx` — client UI patterns.

**Project-specific conventions & patterns**
- Lazy Supabase client creation: many files read env vars then call `createBrowserClient(...)` inside functions or effects to avoid runtime errors during build. Follow this pattern rather than creating a global client at module scope.
- Defensive behavior when Supabase is not configured: server routes and pages often return friendly fallbacks (e.g. `api/search` returns 200 with empty results). Preserve these graceful degradations.
- Server-only secrets: `SUPABASE_SERVICE_ROLE_KEY` must be used only in server routes. Do not expose it as `NEXT_PUBLIC_`.
- Prisma use is optional at runtime — `DATABASE_URL` may be unset; avoid assuming Prisma DB access in client code.

**Build / run / debug workflows**
- Local dev: `npm run dev` (Next dev with Turbo). Default port 3000.
- Build: `npm run build` runs `next build`. CI/Vercel will run `postinstall` which triggers `prisma generate` (ensure `prisma` config valid or set `DATABASE_URL` if needed).
- Vercel: recommended flow — connect GitHub repo, add env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for production only). The project uses App Router; Vercel auto-builds with `next build`.
- Troubleshooting: inspect Vercel deployment logs (build + runtime). Common failures: TypeScript errors from client/server scope mismatches, runtime 401 if preview SSO/protection enabled, or 404 if aliases not mapped correctly. Use `vercel logs <deployment>` or the Vercel UI inspector.

**Integration points & external dependencies**
- Supabase: `@supabase/supabase-js`, `@supabase/ssr`, `@supabase/auth-helpers-nextjs`. Look for `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` usage.
- Prisma/Postgres: `prisma/` schema + `@prisma/client`. `postinstall` runs `prisma generate` — CI must allow it.
- Vercel: deployments, environment variables, SSO settings and aliases. Agent actions that change project settings should use the Vercel API carefully (ssoProtection, envs, aliases).

**How to add features safely**
- For privileged actions, add a server route under `src/app/api/*` and use `SUPABASE_SERVICE_ROLE_KEY` there (example: `api/admin/create-user/route.ts`).
- Keep client code free of service-role secrets and create Supabase clients inside event handlers/effects to avoid build-time errors.
- When changing types or effect scopes, run `npm run build` locally to catch TypeScript errors that Vercel will block on.

**Examples to reference in PRs**
- Creating users server-side: `src/app/api/admin/create-user/route.ts`.
- Ping Supabase endpoint: `src/app/api/ping-supabase/route.ts` (used for health checks).
- Defensive search API: `src/app/api/search/route.ts`.

If anything here is unclear or you'd like a different focus (tests, CI, or deployment scripts), tell me which area to expand and I'll iterate.