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

---

## 2026-06-05 — Issue #5: Pages tracer (richText block, WP mapper, nested URL resolution, seed)

**Built** the complete vertical page slice end-to-end:

- **`app/lib/wp-html.ts`**: `cleanWpHtml` — Divi footer cut at `id="kontakt"`, host normalise
  (`zal-lj.splet.arnes.si` → `www.zal-lj.si`), entity decode (Slovenian diacritics &#353;=š
  etc.), shortcode strip (`[gallery]`, `[et_pb_*]`), `<style>` strip, WP resize suffix strip.
  Returns `{portableText, gallery}`. 15 unit tests.
- **`app/lib/wp-page.ts`**: `wpPageToPageDoc` maps WP REST page → Sanity seed doc
  (`page.{slug}` stable ids, `_oldPath`, parent refs). `WP_CLEAN_SLUG` overrides numeric
  suffixes; `WP_SKIP_IDS` omits containers. 7 unit tests.
- **`app/lib/page-chain.ts`**: `matchesChain` — strict ADR-0004 chain validation; wrong
  length or wrong ancestor → false → 404. 7 unit tests.
- **Sanity schema**: `figure` (image + alt + caption), `richTextBlock` (h2/h3/blockquote/
  bullet/number/link/figure), `page` (title/slug/parent ref/blocks/`_oldPath`). Schema types
  registered in `index.ts`.
- **Block registry SSOT** (`blockRegistry.ts`): `{ richTextBlock: RichTextBlock }`. Page
  schema derives `blocks` field from `Object.keys(blockRegistry)` — schema + renderer cannot
  drift. 2 SSOT guard tests.
- **`RichTextBlock.tsx`**: renders h2/h3/h1→h2/blockquote/lists/links via
  `@portabletext/react`. h1 from WP content is demoted to h2 since the page route owns h1.
- **`BlockRenderer.tsx`**: `BlockList` dispatches through registry by `_type`.
- **`Breadcrumbs.tsx`**: cumulative paths `[topmost..directParent]` from GROQ ancestors.
- **`routes/website/page.tsx`**: catch-all `'*'` route. Loader splits URL into segments,
  queries by last segment, then validates full ancestor chain. Wrong chain → 404. Includes
  `ErrorBoundary` for 404 + generic errors.
- **`pageQuery`**: GROQ with 3-level `parent->parent->slug.current` chain + filtered
  breadcrumbs array.
- **`client.server.ts`**: added `useCdn: false` — bypasses CDN for freshly written docs.
- **`scripts/seed-pages.ts`**: topological sort (parents before children for referential
  integrity), per-URL image upload memo, idempotent `createOrReplace`, 116 docs written.
  20 image upload failures for encoded filenames (Sanity "Bad Request") — silently skipped.
- **`start` script fix**: `NODE_ENV=production node -r dotenv/config` wraps `react-router-serve`
  to load `.env`. Required because `@sanity/react-loader`'s `loadQuery` for `perspective:
  'published'` uses `resultSourceMap: 'withKeyArraySelector'` which silently returns `null`
  without a valid bearer token — queries never error, they just return empty results.

**TDD**: red→green per seam — `wp-html`, `wp-page`, `page-chain`, `blockRegistry` SSOT guard.

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (8 files, 67 tests), `pnpm build` ✓,
`pnpm test:e2e` ✓ (5 tests: home + 2-level + 3-level pages, 404-unknown, 404-wrong-chain).

**Notes for next iteration**:
- 20 image uploads failed (Sanity "Bad Request" on certain encoded filenames); figures
  are silently skipped so those pages render without their images. Re-run with cleaned
  filenames or fetch via the Sanity asset API if images are needed.
- `@portabletext/react` logs "Unknown block type 'figure'" at runtime — figure rendering
  in the RichTextBlock is not yet wired (issue #6 or later). Cosmetic console warning only.
- The `start` script uses `node -r dotenv/config` for local E2E; in a production deploy
  environment variables should be injected by the platform (not .env file).
- h1 blocks from WP content are demoted to h2 in the renderer — this is intentional.
  If editors want real h1 sections, the richTextBlock schema would need updating.

---

## 2026-06-05 — Issue #6: Table block (mapper split, schema, accessible renderer, re-seed)

**Built** the complete table block slice end-to-end:

- **`app/lib/wp-html.ts`**: `extractTable` — parses a `<table>` HTML string into
  `WpTableData { rows: WpTableRow[] }`. Header detection: `<th>` cells, `<thead>`
  wrapper, or first-row-all-strong heuristic (all cells entirely wrapped in `<strong>`).
  Cell text = nested markup flattened (`<br>`→space, all tags stripped, entities decoded).
  Tolerates colspan/rowspan. `splitHtmlSegments` — splits raw HTML at `<table>` boundaries
  into interleaved `{kind:'prose'|'table', html}` segments for document-order multi-block
  output. 12 new unit tests (RED→GREEN).
- **`app/lib/wp-page.ts`**: `wpPageToPageDoc` rewritten to call `splitHtmlSegments` first,
  then produce `richTextBlock` for prose segments and `tableBlock` for table segments, in
  document order. Exported `RichTextPageBlock` and `TablePageBlock` union types. 3 new
  unit tests; all 17 existing tests still pass.
- **Sanity schema**: `tableCellType` / `tableRowType` / `tableBlockType` — rows with
  `isHeader` boolean + `cells[]` string fields. Registered in `schemaTypes/index.ts`;
  Studio editing works (rows/cells/isHeader toggle).
- **`app/components/blocks/TableBlock.tsx`**: header rows → `<thead>/<th scope="col">`;
  body rows → `<tbody>/<td>`; `overflow-x-auto` wrapper for responsive overflow.
- **Block registry**: `tableBlock: TableBlock` added; existing SSOT guard confirms
  schema + renderer cannot drift.
- **`app/sanity/queries.ts`**: `pageQuery` updated with conditional GROQ projection —
  `_type == "richTextBlock" => { body[]{...} }` and
  `_type == "tableBlock" => { rows[]{_key,isHeader,cells[]} }`.
- **`scripts/seed-pages.ts`**: `buildSeedDoc` now iterates all blocks, resolves figures
  only in richTextBlocks, passes tableBlocks through unchanged. Re-seed: 116 docs written.

**TDD**: RED→GREEN per seam — `extractTable` (8 tests), `splitHtmlSegments` (4 tests),
`wpPageToPageDoc` table blocks (3 tests).

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (8 files, 82 tests), `pnpm build` ✓,
`pnpm test:e2e` ✓ (6 tests: prior 5 + new katalog table E2E).

**Notes for next iteration**:
- 222 tables in raw WP dump are almost all in Divi footer sections (`id="kontakt"`)
  and are cut by `cutDiviFooter`. Only 12 real content tables survive across 4 pages:
  `zala-v-ljubljani`, `zala-v-idirji`, `katalog-informacij-javnega-znacaja`,
  `zgodovina-arhiva`. None have `<th>` elements — all render as body-only tables.
- The first-row-all-strong heuristic does NOT fire on any ZAL data (ZAL tables have
  mixed cell content). The heuristic is correct and tested for future data.
- `pageQuery` conditional projection pattern is now the model for future blocks
  (embed, gallery) that also have non-`body` fields.

---

## 2026-06-05 — Issue #7: Embed block (iframe lift, URL classification, renderers, re-seed)

**Built** the complete embed block slice end-to-end:

- **`app/lib/wp-embed.ts`**: `classifyEmbedUrl` — pure URL classifier returning
  `'youtube' | 'googleMaps' | 'googleForms' | 'mapbox' | 'unknown'`. 5 unit tests.
- **`app/lib/wp-html.ts`**: Extended `HtmlSegment` union to include
  `{kind: 'embed', src: string}`. Extended `splitHtmlSegments` to split at `<iframe>` tags
  alongside tables, in document order. Decodes HTML entities in src (`&#038;` → `&`) and
  normalizes arnes host. 6 new unit tests in `wp-html.test.ts`.
- **`app/sanity/schemaTypes/blocks/embedBlock.ts`**: `embedBlockType` — single `url` string
  field. Registered in `schemaTypes/index.ts`.
- **`app/components/blocks/EmbedBlock.tsx`**: responsive renderer (56.25% padding-top 16:9
  container for youtube/maps/mapbox; auto-height for forms). YouTube uses
  `youtube-nocookie.com` domain. Unknown fallback = plain `<a>` link. `loading="lazy"` on
  all iframes.
- **Block registry**: `embedBlock: EmbedBlock` added; SSOT guard continues to pass.
- **`app/sanity/queries.ts`**: `embedBlock` GROQ projection `{ url }` added.
- **`app/lib/wp-page.ts`**: `EmbedPageBlock` type; `wpPageToPageDoc` handles
  `segment.kind === 'embed'` → `embedBlock`. 3 new unit tests.
- **`scripts/seed-pages.ts`**: no change needed — embedBlocks pass through the existing
  `else` branch unchanged.
- **Re-seed**: 116 documents written. `kako-do-nas` (5 maps), `filmoteka-zal` (3 YouTube),
  `prijavnica-*` and `prijava-*` pages (Google Forms) all seeded with embed blocks.

**TDD**: red→green per seam — `classifyEmbedUrl` (5 tests), `splitHtmlSegments` iframe
extension (6 tests), `wpPageToPageDoc` embed blocks (3 tests).

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (9 files, 95 tests), `pnpm build` ✓,
`pnpm test:e2e` ✓ (9 tests: prior 6 + 3 new embed E2E — kako-do-nas maps, filmoteka
youtube, prijava-za-seminar forms).

**Notes for next iteration**:
- Mapbox URLs contain `&#038;` (HTML-encoded `&`) — decoded at split time in
  `splitHtmlSegments`. Verified with unit test.
- `filmoteka-zal` is a Divi-heavy page; `cleanWpHtml` extracts headings/paragraphs from
  the Divi layout surrounding the iframes. Content is useful but Divi-derived. Not a bug.
- Google Forms iframes use `minHeight: 600px` since forms vary wildly in height (640–4500px)
  — the WP heights are not stored, so a reasonable default is used. The form renders
  correctly; scroll will cut off taller forms. Editors can adjust in Studio if needed.
- The existing 20 image upload failures (certain encoded filenames → Sanity "Bad Request")
  persist — same as issue #5/#6; cosmetic only, figures skipped on those pages.

---

## 2026-06-05 — Issue #8: Gallery block (mapper, schema, grid+lightbox, disk-upload memo, re-seed)

**Built** the complete gallery block slice end-to-end:

- **`app/lib/wp-gallery.ts`**: Two pure extraction functions — `extractInlineGallery`
  (parses `et_pb_gallery_item` anchor hrefs for full-size URLs, falls back from
  `img[alt]` to `a[title]`, normalises arnes host) and `nggNth` (extracts index N
  from `ngg_shortcode_N_placeholder`). 13 unit tests (RED→GREEN).
- **`app/lib/wp-html.ts`**: Renamed `GalleryImage.src → url` for consistency; extended
  `HtmlSegment` union with `{ kind: 'gallery'; images }` and `{ kind: 'ngg'; nth }`;
  extended `splitHtmlSegments` to cluster `et_pb_gallery_item` spans into gallery
  segments and detect ngg placeholders — all in document order alongside tables/embeds.
  6 new unit tests.
- **`app/lib/wp-page.ts`**: `GalleryPageFigure` + `GalleryPageBlock` types; optional
  fourth param `galleries?: GalleriesData` on `wpPageToPageDoc` for ngg resolution
  (maps to `galleries[cleanSlug].scans[*].sourceUrl`); handles `gallery` and `ngg`
  segment kinds in the main block-building loop. 4 new unit tests.
- **Sanity schema**: `galleryBlockType` (array of figures); `figure.alt` now `required()`
  in the Studio. Registered in `schemaTypes/index.ts`.
- **`GalleryBlock.tsx`**: Responsive CSS grid (`grid-cols-2 sm:3 md:4`) + keyboard-
  accessible lightbox: focus trap (Tab/Shift-Tab cycling), Escape closes, arrow keys
  navigate, `role="dialog" aria-modal="true"`. LQIP/lazy-load thumbs. Fallback
  placeholder div for missing assets.
- **Block registry**: `galleryBlock: GalleryBlock` added; SSOT guard passes.
- **`pageQuery`**: `galleryBlock` GROQ projection `figures[]{_key, alt, caption, asset->}`.
- **`seed-pages.ts`**: Loads `download/galleries.json`; disk-based upload from
  `download/scans/<slug>/<file>` via `uploadFromDisk`; persistent
  `download/gallery-asset-memo.json` (localPath → assetId — re-run uploads nothing).
  Passes `galleries` to `wpPageToPageDoc`. Skips gallery blocks whose figures have no
  disk files (warns per missing figure). Re-seeded: 116 docs written, galerija 12 scans
  uploaded from disk.

**TDD**: red→green per seam — `wp-gallery.ts` (13 tests), `splitHtmlSegments` gallery/ngg
(3 tests), `wpPageToPageDoc` gallery blocks (4 tests).

**Results**: `pnpm typecheck ✓`, `pnpm test ✓` (10 files, 115 tests), `pnpm build ✓`,
`pnpm test:e2e ✓` (11 tests: 9 prior + 2 new — galerija grid renders, lightbox
opens+closes via keyboard).

**Deferred / notes for next iteration**:
- 12 other pages have `et_pb_gallery_item` HTML (ljubezen-gre-skozi-zelodec, ucne-ure,
  znanje-ki-izginja, etc.) but their scans are NOT in `download/galleries.json` (full
  scrape not yet run). These pages get their galleryBlock skipped; they seed as prose
  only. Run `pnpm scrape` to completion to fix all at once.
- `nggNth` resolves ngg placeholders via `galleries[cleanSlug]` — the only ngg pages
  in the current dump are `privilegijska-knjiga` and `knjigarna` (both not in
  galleries.json yet); they'll get galleries once the full scrape runs.
- `[@portabletext/react] Unknown block type "figure"` console warning still appears
  — figure rendering inside richTextBlock body is cosmetic-only; the figure schema
  IS registered but PortableText needs a custom components map (future issue or
  inline fix in RichTextBlock.tsx).
- `filmoteka-zal` was confirmed to have 0 gallery scans (all YouTube embeds, handled
  by embedBlock from issue #7) — no gallery block needed or added.

---

## 2026-06-05 — Issue #9: Posts + categories (schema, category collapse, /novice + /arhivalija-meseca, seed)

**Built** the complete posts + categories vertical slice:

- **`app/lib/wp-post.ts`**: `CATEGORY_COLLAPSE` table maps 10 WP category ids to
  4 canonical slugs (nerazvrsceno id=1 dissolves; year variants 71/72/80/149/150
  all → `arhivalija-meseca`). `collapseCategories` deduplicates in input order.
  `wpPostToPostDoc` maps WP REST post → Sanity seed doc: stable `_id` (truncated
  to 128-char Sanity limit for 17 posts with very long slugs), date passthrough,
  category refs, mainImage from `mediaById` lookup, blocks via same
  `splitHtmlSegments`/`cleanWpHtml` pipeline as pages (no ngg handling — posts
  don't have ngg shortcodes), `_oldPath` from WP link.
- **`app/lib/wp-post.test.ts`**: 18 unit tests (RED→GREEN): category collapse table,
  year-variant dedup, multi-cat, nerazvrsceno dissolve, title entity decode, slug
  passthrough, date passthrough, _oldPath from link, mainImage from mediaById, no
  mainImage when featured_media=0, block output.
- **Sanity schema**: `categoryType` (title+slug doc), `postType` (title/slug/
  datetime/categories[ref→category]/mainImage(figure)/blocks[from blockRegistry]/
  _oldPath). Both registered in `schemaTypes/index.ts`. Desk sidebar updated:
  Novice + Kategorije list items added.
- **`app/sanity/queries.ts`**: `postListQuery` (combined `{posts,total}` object
  projection, `$cat`/`$offset`/`$lastIndex` params, inclusive GROQ slice),
  `postQuery` (single post + blocks), `arhivaListQuery` (all arhivalija-meseca),
  `categoriesQuery`. Added shared `BLOCKS_PROJECTION` constant — both page and
  post queries derive the block projection from it.
- **Routes**: `/novice` (category filter chips nav + 12-per-page pagination via
  `?kat=` / `?stran=`), `/novice/:slug` (post detail with mainImage/date/
  category chips/blocks + breadcrumb), `/arhivalija-meseca` (series listing with
  thumbnail strip). All wired before the catch-all in `routes.ts`.
- **`scripts/seed-posts.ts`**: seeds 4 canonical category docs then all 311
  published posts. `mainImage` uploaded via in-memory URL→assetId memo. Body
  and gallery figures resolved same as `seed-pages`. Idempotent (`createOrReplace`
  + stable ids). `pnpm seed:posts` added to `package.json`.
- **E2E** (`e2e/novice.spec.ts`): 6 new tests — listing renders with post links,
  filter chips nav present, category filter renders, listing→detail navigation
  with breadcrumb, 404 on missing slug, /arhivalija-meseca listing renders.

**TDD**: RED→GREEN per seam — `collapseCategories` (7 tests), `wpPostToPostDoc`
(11 tests).

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (11 files, 133 tests), `pnpm build` ✓,
`pnpm test:e2e` ✓ (17 tests: 11 prior + 6 new). Seed: 4 categories + 311 posts written.

**Deferred / notes for next iteration**:
- ~120 mainImage upload failures (Sanity "Bad Request" — encoded filenames,
  .gif files, some .jpg files rejected by Sanity image validator). Same pattern
  as pages. Posts render without those images. Cosmetic only.
- Slug truncation: 17 posts had WP slugs > 123 chars; `makeSafeId` truncates to
  fit 128-char Sanity limit. Sanity `slug.current` stores the FULL WP slug (for
  routing), while `_id` is truncated. No collision risk given the data.
- `_oldPath` stored in every post doc (`/YYYY/MM/DD/slug/`) — issue #15 (redirects)
  can consume this to build the 301 map.
- `BLOCKS_PROJECTION` extracted as shared constant in `queries.ts` — pageQuery now
  derives its projection from it too (refactor done in this iteration).
- Category filter `?kat=` uses `""` (empty string) as the "all" sentinel, matching
  Sanity's GROQ `$cat == ""` comparison (null/undefined params caused GROQ errors).
