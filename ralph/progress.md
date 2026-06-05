# Ralph progress log

One dated entry per iteration: issue number, what was built, test/build results, anything deferred or surprising for the next iteration. Newest entries at the bottom.

---

## 2026-06-05 — Issue #2: Scaffold (RR7 + Vite + TS + Tailwind v4 + shadcn + tests + Docker)

**Built** the greenfield application scaffold:
- RR7 framework mode (SSR), Vite, TypeScript strict, pnpm, Node 22. `package.json`,
  `react-router.config.ts` (`ssr: true`), `vite.config.ts` (tailwind + reactRouter +
  tsconfigPaths, host 0.0.0.0), `tsconfig.json` (`~/*` alias, strict).
- Tailwind v4 via `@tailwindcss/vite` (no config file). Variant-A tokens as CSS custom
  properties in `app/styles/app.css`: `--zal #8b1d1c` (primary), `--zal-light #ba3741`
  (secondary), Inter (`@fontsource-variable/inter`), white + `--stone-50` surfaces,
  `--coal #171412` footer. shadcn wired (`components.json` new-york/stone, `app/lib/utils.ts`
  `cn`, `app/components/ui/button.tsx`).
- Routes: `layout(website/layout)` → `index(website/home)`. Header (banner) + main + Footer
  (contentinfo) chrome are placeholders — real nav/footer are CMS-driven in later slices.
- Tooling: ESLint flat config + typescript-eslint + react-hooks, Prettier (sort-imports +
  tailwind plugin), Vitest (node env, `app/**/*.test.ts`), Playwright (E2E vs prod build,
  structure-only).
- `Dockerfile` (multi-stage node:22-alpine, corepack pnpm, `react-router-serve` on PORT 3000)
  + `.dockerignore`. `README.md` quickstart + env-var table. `.env.example`.

**TDD**: red→green on `cn` (the one genuine logic seam in the scaffold) — wrote
`app/lib/utils.test.ts` first (RED: module missing), then minimal `utils.ts` (GREEN). Two
behavior assertions: falsy filtering + Tailwind-conflict last-wins (so `className` overrides work).

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (1 file, 2 tests), `pnpm lint` ✓,
`pnpm build` ✓, `pnpm test:e2e` ✓ (1 test, home landmarks vs prod build),
`docker build` ✓ + container served `/` 200 with `<header>/<main>/<footer>`.

**Notes for next iteration**:
- Build prints RR v8 future-flag warnings (passthrough/trailing-slash/etc.) — informational,
  not opted in. Revisit if a slice needs middleware (ADR-0001 territory).
- No Sanity yet (by design). `.env` has real tokens; `.env.example` documents the keys.
  Issue #4 wires the embedded Studio + intake seam.
- `pnpm dev` not exercised (no long-running servers per Ralph rules); same RR toolchain as
  build/start which are verified.
- First Playwright run needs `pnpm exec playwright install chromium`.
