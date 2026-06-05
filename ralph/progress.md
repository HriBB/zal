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

---

## 2026-06-05 — Issue #3: Gallery scrape script (NextGEN scans + breadcrumb→collection map)

**Built** the standalone scrape pass that recovers what the WP REST dump can't (the
`ngg_shortcode` placeholder hides every Digiteka gallery — ADR 0002):
- `app/lib/scrape-gallery.ts` — pure, unit-tested seam (network-free): `normalizeHost`
  (arnes→www), `extractGalleryUrls` (anchor-href originals from both NextGEN
  `blogs.dir/<id>/files/` and the Divi `et_pb_gallery` on /galerija/; drops thumbs/logo
  chrome, strips WP `-300x200` resize suffixes, dedups in document order),
  `extractBreadcrumb` + `breadcrumbToCollection` (Domov > Digiteka > **collection** >
  item; null when an item sits directly under Digiteka or has no breadcrumb),
  `scanLocalPath` (`scans/<slug>/<file>`).
- `scripts/scrape-galleries.ts` — orchestration (fetch/throttle/download/disk only). Work
  list = 659 ngg projects + galerija + filmoteka (= **661 targets**). Resumable: skips
  slugs already recorded `ok` and scans already on disk; persists `galleries.json` after
  every target. Env knobs: `SCRAPE_SLUGS`, `SCRAPE_LIMIT`, `SCRAPE_DELAY` (default 400ms),
  `SCRAPE_DOWNLOAD=0` (index only), `SCRAPE_FORCE=1`. `pnpm scrape` script added.
- Outputs are DATA → written OUTSIDE the repo under `/Users/bojan/www/zal/download/`:
  `galleries.json` (slug → {url, status, collection, breadcrumb, item, scans:[{sourceUrl,
  localPath}]}), `scrape-failures.json` ([{slug,url,error}]), `scans/<slug>/…`.

**TDD**: red→green per pure function (12 tests in `scrape-gallery.test.ts`) — host norm,
full-res-not-thumbs, logo skip, Divi resize-strip, dedup/order, breadcrumb parse + the
two collection edge cases (direct-under-Digiteka, no-breadcrumb), local path.

**Live smoke** (against www.zal-lj.si): `cod-i-knjiga-43-1674` → 20 scans, collection
`kodeksi`, host normalised; real download = 20 files / 3.5 MB / 0 thumbs; re-run skips
(index + on-disk). `galerija` (Divi) → 12 scans, collection null. `filmoteka` → 200, 0
scans (its films are video embeds — slice #7's embed block, not scans).

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (2 files, 14 tests), `pnpm lint` ✓,
`pnpm build` ✓ (added `allowImportingTsExtensions` to tsconfig so the script can import the
`.ts` seam under `node --experimental-strip-types`, mirroring letece-kele).

**Deferred / notes for next iteration**:
- The FULL harvest (all 661 targets + their binaries) is a one-time, network-heavy DATA op
  — run `pnpm scrape` to completion when ready; it's resumable, so partial state is fine.
  So far only `cod-i-knjiga-43-1674` (+galerija/filmoteka index) are seeded in
  `download/galleries.json`; the rest still need a run.
- Divi `et_pb_gallery` pages link originals straight out of `/files/` (no NextGEN
  container) — the extractor handles both, but if a future ngg page nests galleries
  differently, re-check `extractGalleryUrls`.
- `breadcrumbToCollection` returns only the immediate parent collection; the full
  `breadcrumb` text array is also stored, so the seed (issues #11/#12) can reconstruct a
  deeper chain if one ever appears.

---

## 2026-06-05 — Issue #4: Sanity wiring (embedded Studio, intake seam, siteSettings, CMS-driven chrome)

**Built** the full Sanity integration tracer:
- Packages added: `@sanity/client`, `@sanity/react-loader`, `sanity`, `@sanity/icons`,
  `@sanity/vision`, `@sanity/visual-editing`, `dotenv`.
- `app/sanity/` seam: `constants.ts` (`STUDIO_BASEPATH=/studio`), `projectDetails.ts`
  (env → window.ENV → import.meta.env cascade), `client.ts` (tokenless CDN),
  `client.server.ts` (read-token authenticated, server-only), `loader.server.ts`
  (setServerClient + stega config), `loadQueryOptions.server.ts` (cookie→perspective,
  SANITY_READ_TOKEN guard), `data.ts` (`SanityQuery` descriptor + `useSanity`),
  `data.server.ts` (`loadSanity`: params default, notFoundIfEmpty 404, withPreview toggle).
- `app/sanity/queries.ts`: `siteSettingsQuery` + `SiteSettings` / `NavItem` / `FooterLink`
  / `SocialLink` types.
- `app/sanity/schemaTypes/singletons/siteSettings.ts`: two-level nav (internal/external
  per item), footerLinks, socialLinks, externalArchiveLinks.
- `app/sanity/desk/index.ts`: Studio structure — singleton editor for siteSettings.
- `app/sanity/presentation/resolve.ts`: Presentation location.
- `sanity.shared.ts` + `sanity.config.ts`: shared Studio config (structureTool +
  presentationTool + visionTool); CLI entry reads from SANITY_STUDIO_* / SANITY_* env.
- `app/components/SanityStudio.tsx`: in-app Studio with Vite env vars.
- `app/routes/studio.tsx`: `/studio/*` route (noindex meta).
- `app/routes/resource/preview.ts`: GET enables preview cookie (session.set projectId),
  POST destroys it.
- `app/routes.ts`: added `studio/*` and `resource/preview` routes.
- `app/routes/website/layout.tsx`: loads siteSettings via `loadSanity`, passes to
  Header/Footer.
- `Header.tsx`: two-level nav with hover dropdown; external links open in new tab.
- `Footer.tsx`: three-column grid (identity+social / useful links / external archives).
- `app/root.tsx`: root loader exposes `VITE_SANITY_*` as `window.ENV` for client bundle.
- `scripts/seed-site-settings.ts`: idempotent (`createIfNotExists` default; `SEED_FORCE=1`
  → `createOrReplace`); full ZAL navigation + footer links derived from old site IA.
  Ran successfully against Sanity production.

**TDD**: 2 new test files (RED→GREEN):
- `loadQueryOptions.server.test.ts` — 3 tests: published/drafts/missing-token.
- `data.server.test.ts` — 5 tests: param forward, default-params, notFoundIfEmpty
  (null/exists), withPreview flag.

**Results**: `pnpm test` ✓ (4 files, 22 tests), `pnpm typecheck` ✓, `pnpm build` ✓,
`pnpm test:e2e` ✓ (1 test, nav+footer landmarks), `pnpm seed` ✓.

**Notes for next iteration**:
- Studio is embedded but Visual Editing (click-to-edit overlays) is deferred to issue #17.
- `window.ENV` is injected by the root loader but NOT yet inlined as a `<script>` tag
  (client-side JS reads `window.ENV` only after hydration — the `projectDetails.ts`
  cascade falls back to `import.meta.env` which Vite handles at build time, so this
  works; but a strict CSP may need the script tag approach later).
- Issue #5 (Pages tracer) is the next ready slice — it needs the `loadSanity` seam that
  now exists, so no blockers.
