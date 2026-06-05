# ZAL Website

Public website of **Zgodovinski arhiv Ljubljana** (Historical Archives of
Ljubljana). Modernization of `zal-lj.si`: React Router 7 (framework mode, SSR)
+ embedded Sanity Studio. Content is Slovenian; code identifiers are English.

See `CONTEXT.md` for the domain glossary and `docs/adr/` for architecture
decisions.

## Stack

- React Router 7 (framework mode, SSR) + Vite + TypeScript (strict)
- Tailwind CSS v4 (Vite plugin, no config file) + shadcn (new-york, stone base)
- Vitest (node env) for unit/seam tests; Playwright for E2E against the
  production build (structure-only assertions)
- pnpm + Node 22+
- Embedded Sanity Studio at `/studio` (arrives in a later slice)

## Quickstart

```sh
pnpm install
pnpm dev          # dev server (Vite) at http://localhost:5173
```

### Commands

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `pnpm dev`           | Vite dev server with HMR                              |
| `pnpm build`         | Production build (`build/client` + `build/server`)    |
| `pnpm start`         | Serve the production build (`react-router-serve`)     |
| `pnpm test`          | Run Vitest unit/seam tests once                       |
| `pnpm test:watch`    | Vitest in watch mode                                  |
| `pnpm test:e2e`      | Playwright E2E (builds + serves, then runs specs)     |
| `pnpm lint`          | ESLint                                                |
| `pnpm format`        | Prettier write over `app/`                            |
| `pnpm typecheck`     | Generate route types + `tsc --noEmit`                 |

First E2E run needs the browser: `pnpm exec playwright install chromium`.

## Docker

```sh
docker build -t zal-website .
docker run --rm -p 3000:3000 zal-website   # http://localhost:3000
```

## Environment variables

Secrets live in `.env` (git-ignored; never commit). Copy `.env.example` and
fill in real values. No env vars are required for the scaffold to build or run;
they are consumed once the Sanity wiring slice lands.

| Variable                  | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `SANITY_PROJECT_ID`       | Sanity project id (server)                |
| `SANITY_DATASET`          | Sanity dataset                            |
| `SANITY_API_VERSION`      | Sanity API version                        |
| `VITE_SANITY_PROJECT_ID`  | Sanity project id (client/Studio)         |
| `VITE_SANITY_DATASET`     | Sanity dataset (client/Studio)            |
| `VITE_SANITY_API_VERSION` | Sanity API version (client/Studio)        |
| `SANITY_READ_TOKEN`       | Read token (private dataset, SSR loader)  |
| `SANITY_WRITE_TOKEN`      | Write token (seed/migration scripts)      |
| `SANITY_SESSION_SECRET`   | Session secret for preview/visual editing |
