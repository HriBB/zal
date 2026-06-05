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

## Accessibility gate (WCAG 2.1 AA)

Slovenian public institutions are legally required to meet WCAG 2.1 AA under the EU Web Accessibility Directive. The quality gate is **Lighthouse accessibility ≥ 95** on the five key templates.

### How to run

Requires the production server running (`pnpm build && pnpm start`) or a deployed preview URL.

```sh
# Install Lighthouse CLI once
npm install -g lighthouse

# Run against each key template (adjust origin as needed)
lighthouse http://localhost:3000/ --only-categories=accessibility --output=json --output-path=lh-home.json
lighthouse http://localhost:3000/novice --only-categories=accessibility --output=json --output-path=lh-novice.json
lighthouse http://localhost:3000/digiteka --only-categories=accessibility --output=json --output-path=lh-digiteka.json
lighthouse http://localhost:3000/iskanje --only-categories=accessibility --output=json --output-path=lh-iskanje.json
```

Or use Lighthouse CI for batch runs:

```sh
npx @lhci/cli autorun --collect.url=http://localhost:3000/ \
  --collect.url=http://localhost:3000/novice \
  --collect.url=http://localhost:3000/iskanje \
  --assert.assertions."categories:accessibility".minScore=0.95
```

### Threshold

| Metric                | Gate    |
| --------------------- | ------- |
| Lighthouse a11y score | ≥ 95    |
| WCAG level            | 2.1 AA  |

Run Lighthouse after any change to HTML structure, focus styles, ARIA attributes, or color tokens. Include in pre-release CI on the staging URL.

### Accessibility statement

The `/izjava-o-dostopnosti` page is required by law. Seed the draft, review the legal wording, then publish from Studio:

```sh
pnpm seed:izjava   # seeds as Sanity draft — NOT published yet
# → open /studio → Pages → "Izjava o dostopnosti" → review → Publish
```

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
