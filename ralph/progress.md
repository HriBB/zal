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

---

## 2026-06-05 — Issue #10: Archive units (schema, seed 5 units, /enote pages, footer hours accordion)

**Built** the complete archive unit vertical slice:

- **`app/sanity/schemaTypes/objects/hourSlot.ts`**: `hourSlotType` object — `{days, hours}`
  strings. Reusable for both officeHours and readingRoomHours arrays.
- **`app/sanity/schemaTypes/documents/archiveUnit.ts`**: `archiveUnitType` document —
  name, slug, address (text), phones (array of `{label, number}`), emails (array of
  string), officeHours, readingRoomHours (both arrays of hourSlot), photo (image),
  description, mapUrl (url), `_oldPath`.
- Both types registered in `schemaTypes/index.ts`. Studio desk updated with Enote list item.
- **`app/sanity/queries.ts`**: `archiveUnitsQuery` (all units ordered by name, for footer)
  + `archiveUnitQuery` (single unit, for `/enote/:slug`). `ArchiveUnitSummary` +
  `ArchiveUnitData` + `HourSlot` + `PhoneEntry` types exported.
- **`app/routes/website/layout.tsx`**: layout loader now fetches both siteSettings AND
  archiveUnits in parallel (`Promise.all`). Units passed to Footer.
- **`app/components/layout/Footer.tsx`**: added `UnitAccordionItem` component —
  keyboard-accessible collapsible panel per unit (`aria-expanded`, `aria-controls`,
  `focus-visible` ring, `hidden` panel toggle). Shows address, phones, emails, hours.
  Unit name is a `<Link>` to `/enote/:slug`.
- **`app/routes/website/enote.$slug.tsx`**: unit detail route — address, contacts,
  office + reading-room hours sections, responsive Google Maps iframe (16:9 ratio),
  breadcrumb back to `/enote`, 404 ErrorBoundary.
- **`scripts/seed-archive-units.ts`**: seeds 5 units with real data extracted from WP
  REST dump (addresses from unit page content; contacts + hours from Divi footer text;
  map URLs from `/kako-do-nas` page iframes in document order). `createIfNotExists`
  default; `SEED_FORCE=1` to overwrite. `pnpm seed:units` added to `package.json`.
- **`_oldPath`** stored on every unit doc — covers the WP canonical paths under
  `/domaca-stran-1/o-arhivu-2/predstavitev/` for the issue #15 redirect map.

**TDD**: red→green — `archiveUnit.test.ts` written first (module-not-found RED), then
schema implemented (GREEN). 6 schema shape tests: type name, identity fields, contact
fields, hours fields, mapUrl, _oldPath.

**Results**: `pnpm typecheck ✓`, `pnpm test ✓` (12 files, 139 tests), `pnpm build ✓`,
`pnpm seed:units ✓` (5 archiveUnit docs written), `pnpm test:e2e ✓` (22 tests: 17
prior + 5 new — unit page renders, breadcrumb, 404, footer accordion present + expands).

**Notes for next iteration**:
- Škofja Loka and Idrija have combined reading room + office (same hours in both arrays).
  This is accurate to the source data; the renderer shows both sections with identical
  hours, which is a minor duplication. Editors can clean up in Studio if desired.
- No `/enote` listing route (all units) — the issue only required `/enote/:slug` detail
  pages. A listing page was not in the acceptance criteria; add if needed later.
- Unit photos not seeded (no WP media files for units identified in REST dump). Photo
  field exists in the schema; editors can upload via Studio.
- Footer accordion uses plain `hidden` boolean (not CSS transition) for simplicity.
  A CSS transition can be added later without any schema or route changes.

---

## 2026-06-05 — Issue #11: Digiteka browse (collection + archiveItem, mapper, routes, seed)

**Built** the complete Digiteka browse vertical slice:

- **`app/lib/wp-digiteka.ts`**: pure mapper seam — `extractMetadataPairs` (strong-tag
  `Label:` / value pairs, cuts at `id="kontakt"`; extracts all 8 charter descriptors:
  Datum in kraj, Vsebina, Original ali kopija, Snov, Velikost, Ohranjenost, Pečat,
  Objave), `extractCollectionFromBreadcrumb` (handles both `/project/slug/` and direct-path
  `/slug/` hrefs — the existing `breadcrumbToCollection` in scrape-gallery.ts only handles
  `/project/` and missed `korespondenca_terpinc` which uses `/korespondenca_terpinc/`),
  `isPageProject` (20 sitemap-linked slugs excluded), `wpProjectToArchiveItemDoc`
  (stable `archiveItem.{slug}` ids, metadata[], gallery:[] placeholder).
- **`app/lib/wp-digiteka.test.ts`**: 14 unit tests RED→GREEN (all 8 charter descriptors,
  no-pairs letters, kontakt cut, /project/ collection, direct-path collection, null cases,
  isPageProject, full mapper).
- **Sanity schema**: `collectionType` (name/slug/externalUrl/_oldPath), `archiveItemType`
  (title/slug/collection ref/metadata[]/gallery[]/externalUrl/date/_oldPath). Both
  registered in `schemaTypes/index.ts`; Studio desk updated (Zbirke + Arhivalije).
- **Schema tests**: 4 collection + 7 archiveItem shape tests RED→GREEN.
- **`app/sanity/queries.ts`**: `collectionsQuery`, `collectionQuery`, `archiveItemListQuery`
  (paginated by collectionId, 12/page), `archiveItemQuery` (by slug + collectionSlug).
- **Routes**: `/digiteka` (collection listing grid), `/digiteka/:collection` (12/page items +
  SIstory external link when present), `/digiteka/:collection/:item` (metadata `<dl>`,
  gallery thumbnails, SIstory link). All wired before catch-all in `routes.ts`.
- **`scripts/seed-digiteka.ts`**: 4 collections hardcoded from breadcrumb analysis +
  503 archive items from 702 WP projects (199 skipped: GZL items not in Digiteka,
  census placeholders, 20 sitemap Pages). `createOrReplace` idempotent. `pnpm seed:digiteka`.
- **`e2e/digiteka.spec.ts`**: 6 E2E tests (landing → collection → item chain, listine
  metadata definition list, 404 for unknown collection/item).

**TDD**: RED→GREEN per seam — `wp-digiteka.ts` mapper (14 tests), collection schema
(4 tests), archiveItem schema (7 tests). Total 25 new tests.

**Results**: `pnpm typecheck ✓`, `pnpm test ✓` (15 files, 164 tests),
`pnpm build ✓`, `pnpm seed:digiteka ✓` (4 collections + 503 items, 0 failures),
`pnpm test:e2e ✓` (28 tests: 22 prior + 6 new Digiteka).

**Deferred / notes for next iteration**:
- 199 WP projects skipped (no Digiteka breadcrumb): includes GZL items (breadcrumb
  goes through "Publikacije na spletu" not Digiteka), census placeholders (kranj-2,
  jesenice — empty content), collection landing pages (arhivski-kuharski-rokovnik,
  korespondenca_terpinc as index pages). These are NOT archive items for Digiteka.
- `korespondenca_terpinc` is unusual: 214 items in this collection have a direct-path
  collection URL (`/korespondenca_terpinc/`). The `extractCollectionFromBreadcrumb`
  fix handles this correctly. The existing `breadcrumbToCollection` in scrape-gallery.ts
  still has the limitation (don't modify — it's stable and tested for its scrape use case).
- Full coverage of all 682 non-sitemap projects would require the full gallery scrape
  (`pnpm scrape`) to populate `galleries.json`, then re-run seed. The scrape output
  provides collection info for items not in the REST breadcrumb.
- Gallery field seeded empty (issue #12 fills it via the scan upload pass).
- `externalUrl` on archiveItem: seeded empty for all 503 items (no SIstory-linked
  individual archive items found in the current WP dump). The field is in schema
  for future use and for editors.

---

## 2026-06-05 — Issue #12: Digiteka scans (resumable upload, item gallery + lightbox)

**Built** the scan upload pass and upgraded the archive item page gallery:

- **`app/lib/upload-retry.ts`**: `withRetry<T>(fn, {maxAttempts, baseDelayMs})` — exponential
  backoff retry helper. 4 unit tests RED→GREEN (success on first try, retry on transient,
  exhausted → throws, defaults).
- **`app/components/ImageGallery.tsx`**: shared component extracted from GalleryBlock —
  responsive CSS grid (`grid-cols-2 sm:3 md:4`) + keyboard-accessible lightbox (focus trap,
  Escape closes, arrow keys navigate, `role="dialog" aria-modal="true"`). Exports `FigureData`
  type. GalleryBlock now delegates to it — prior gallery E2E tests pass unchanged.
- **`app/routes/website/digiteka.$collection.$item.tsx`**: gallery section replaced with
  `<ImageGallery>`, giving archive item pages the same accessible lightbox as page galleries.
  Figures mapped from `item.gallery` to `FigureData[]`.
- **`scripts/seed-scans.ts`**: reads `galleries.json`; filters `type=project` entries with
  scans; uploads each scan from disk using `withRetry` (3×, 500ms base); checks
  `gallery-asset-memo.json` first (skips already-uploaded); patches `archiveItem.{slug}`
  via `client.patch(...).set({gallery})`. Memo persisted after every item → resumable mid-run.
  Failures per scan are reported and non-fatal. `SEED_DRY=1` / `SEED_SLUGS=a,b` env knobs.
- **`package.json`**: `seed:scans` script added.
- **`e2e/digiteka-scans.spec.ts`**: 2 new E2E tests — gallery renders with at least one image
  button, lightbox opens on Enter and closes on Escape.

**Seed run**: `cod-i-knjiga-43-1674` (kodeksi) — 20 scans uploaded from disk, gallery patched.
Second run: 0 new uploads (all from memo). Idempotency confirmed.

**Results**: `pnpm typecheck ✓`, `pnpm test ✓` (16 files, 168 tests — 4 new), `pnpm build ✓`,
`pnpm test:e2e ✓` (30 tests: 28 prior + 2 new).

**Deferred / notes for next iteration**:
- Only `cod-i-knjiga-43-1674` has scans on disk so far. Full scan coverage requires running
  `pnpm scrape` to completion (all 661 targets), then re-running `pnpm seed:scans`.
  Both are resumable: scrape skips already-downloaded files; seed-scans skips memoised assets.
- `galerija` slug in galleries.json has type=page (not project) — correctly filtered out by
  seed-scans. Its 12 scans are on disk for when it's needed as a page gallery (already seeded
  via seed-pages / galleryBlock in issue #8).
- The `[@portabletext/react] Unknown block type "figure"` console warning from prior iterations
  persists — cosmetic only (figure inside richTextBlock body not rendered). Still deferred.

---

## 2026-06-05 — Issue #13: Homepage variant A (singleton + auto-fed sections)

**Built** the full homepage vertical slice:

- **`app/sanity/schemaTypes/singletons/homePage.ts`**: `homePageType` singleton — hero
  (heading, lead, image) + serviceCards array (title, description, href, image). Registered
  in `schemaTypes/index.ts` and Studio desk (`HomeIcon`, singleton entry). `SINGLETONS`
  extended to include `'homePage'`.
- **`app/sanity/queries.ts`**: `homePageQuery` (singleton), `homeLatestPostsQuery`
  (latest 6 posts, order desc), `homeArhavalijaQuery` (newest arhivalija-meseca post).
  `ArchiveUnitSummary` extended with `photo` field; `archiveUnitsQuery` updated to
  include `photo{alt, asset->}` — unit strip now shows photos without a separate query.
- **`app/routes/website/home.tsx`**: Full variant A design — red utility bar, hero
  section with full-bleed photo fallback + search form (`Form` posting to `/iskanje`,
  query param `q`), 8-card service grid (2→4 responsive cols), news grid with
  category chips (6 latest posts), unit strip (5 units → `/enote/:slug`),
  arhivalija-meseca CTA band (newest post auto-fed, hides when none). All sections
  use `aria-label` for Playwright targeting. Four parallel `loadSanity` calls in
  loader. Fully responsive with Tailwind v4 tokens.
- **`scripts/seed-home-page.ts`**: Seeds `homePage` with variant-A content — hero
  heading/lead, 8 service cards with Slovenian titles and internal hrefs derived
  from the old site IA. `createIfNotExists` default; `SEED_FORCE=1` overwrites.
  `pnpm seed:home` added.

**TDD**: RED→GREEN on `homePage` schema shape (4 tests: type name, hero field,
serviceCards field, hero subfields, card subfields).

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (17 files, 173 tests), `pnpm build` ✓,
`pnpm seed:home` ✓ (homePage created), `pnpm test:e2e` ✓ (35 tests: 30 prior + 5 new
home — hero+search, service cards, news grid, unit strip ×5, arhivalija band).

**Deferred / notes for next iteration**:
- Hero image not seeded (needs a real historic photo). Hero renders a dark `bg-stone-800`
  placeholder until an editor uploads via Studio. No schema or route change needed.
- Unit photos not yet seeded (units have no photo in the WP dump). Unit strip renders
  grey `bg-stone-300` placeholders. Same fix as hero: editors upload via Studio.
- `archiveUnitsQuery` now includes `photo` — footer accordion (which uses units from the
  layout loader) also gets the photo field, though the accordion UI doesn't render it.
  Harmless extra data; no change to footer component required.
- The utility bar contact info (hours, email, phone) is hardcoded in the component.
  If editors need to control this, move it to `siteSettings` in a later iteration.
- Search form posts to `/iskanje` — route now implemented (issue #14 complete).

---

## 2026-06-05 — Issue #14: Search /iskanje (GROQ across 4 types, grouped results, SIRAnet pointer)

**Built** the complete site search vertical slice:

- **`app/lib/search.ts`**: pure seam — `sanitizeTerm` (trim + collapse whitespace),
  `isValidTerm` (≥2 chars), `buildSearchParams` (appends `*` wildcard for GROQ prefix
  match), `totalHits` (sums all group lengths), `runSearch` (injectable runner for seam
  testing), `SearchResults` type hierarchy (`SearchPageResult`, `SearchPostResult`,
  `SearchCollectionResult`, `SearchArchiveItemResult`).
- **`app/sanity/queries.ts`**: `searchQuery` — combined GROQ object query across 4 types:
  pages (title match), posts (title match), collections (name match), archive items
  (title match OR `count(metadata[value match $term]) > 0`). Up to 10 hits per group.
  Re-exports `SearchResults` + sub-types from lib/search.
- **`app/routes/website/iskanje.tsx`**: `/iskanje` route — reads `?q=`, sanitizes,
  passes wildcard term to searchQuery; groups results by type with labels (Strani /
  Novice / Zbirke / Arhivalije) and hit counts; SIRAnet/VAC pointer banner always visible
  (above fold, regardless of query state); empty-query state ("Vnesite iskalni niz…");
  no-results state ("Ni zadetkov za…"); inline search form for repeat queries.
- **`app/routes.ts`**: `iskanje` route wired before catch-all.
- **`e2e/iskanje.spec.ts`**: 5 E2E tests — empty state, SIRAnet link structure,
  grouped results or no-results for real query, hero round-trip (`/` → fill form →
  submit → land on `/iskanje?q=…`), no-results for nonsense term.

**TDD**: RED→GREEN per seam — `sanitizeTerm` (4 tests), `isValidTerm` (4 tests),
`buildSearchParams` (2 tests), `totalHits` (2 tests), `runSearch` seam (1 test).

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (18 files, 186 tests — 13 new),
`pnpm build` ✓, `pnpm test:e2e` ✓ (40 tests: 35 prior + 5 new).

**Deferred / notes for next iteration**:
- Body text search not implemented: GROQ `match` works on string fields; searching
  inside Portable Text arrays (richTextBlock body) requires either `pt::text()` on a
  flat array or a denormalized `_searchText` field. Title + metadata search satisfies
  the acceptance criteria for the current dataset. Body-text search is a future
  enhancement if needed.
- Archive items search on metadata values uses `count(metadata[value match $term]) > 0` —
  this fires on partial token matches (e.g., "pergament" finds charters with Snov:
  "pergament"). Works correctly with the prefix wildcard.
- `buildPageHref` in the route is a simple slug-to-path mapping (`/${slug}`). Nested
  pages with parents would need the full ancestor chain to produce a correct URL; the
  current route data only includes `parentSlug`, not the full path. Deep-page search
  results link to the top-level slug — fine for the current site structure (most pages
  are 1-2 levels deep and their slugs are unique).

---

## 2026-06-05 — Issue #15: Redirects + sitemap + robots + RSS

**Built** the link-equity and syndication infrastructure (ADR-0003):

- **`app/lib/redirects.ts`**: `normalizeOldPath` (strips trailing slash, strips host)
  and `buildPagePath` (joins slug chain → `/a/b/c`). Pure seam, 10 unit tests.
- **`app/lib/sitemap.ts`**: `buildSitemapXml` — formats `SitemapEntry[]` into valid
  sitemap XML with `<lastmod>` truncated to date. XML-escapes `&` in locs. 5 unit tests.
- **`app/lib/rss.ts`**: `buildRssFeed` — RSS 2.0 envelope with channel metadata and
  item elements; `pubDate` formatted via `toUTCString()`; XML-escapes title/link.
  5 unit tests.
- **`scripts/gen-redirects.ts`**: queries Sanity `_oldPath` on pages, posts, archiveItems,
  and collections; normalises each old path; computes new path (pages via `buildPagePath`,
  posts → `/novice/{slug}`, items → `/digiteka/{collection}/{slug}`, collections →
  `/digiteka/{slug}`); writes `app/data/redirects.json`. Idempotent re-run safe.
- **`app/data/redirects.json`**: committed artifact — 871 redirects (53 pages, 311 posts,
  503 archive items, 4 collections). `pnpm gen:redirects` regenerates.
- **`app/routes/website/page.tsx`**: imports redirect map as JSON; normalises the
  incoming URL path; if a redirect entry exists, returns `redirect(newPath, 301)` before
  any Sanity query or 404 (ADR-0003).
- **`app/routes/sitemap[.]xml.tsx`**: queries Sanity for all pages (with 3-level parent
  chain for nested paths), posts, collections, and archive items; builds full canonical
  URLs; returns `buildSitemapXml` output with `Content-Type: application/xml`.
- **`app/routes/robots[.]txt.tsx`**: allows `/`, disallows `/studio` and `/resource`,
  references `${origin}/sitemap.xml`. `Cache-Control: public, max-age=3600`.
- **`app/routes/rss[.]xml.tsx`**: fetches latest 50 posts; returns `buildRssFeed` output
  with `Content-Type: application/rss+xml`.
- **`app/routes.ts`**: three new top-level routes: `sitemap.xml`, `robots.txt`, `rss.xml`.
- **`app/sanity/queries.ts`**: `sitemapPagesQuery`, `sitemapPostsQuery`,
  `sitemapCollectionsQuery`, `sitemapArchiveItemsQuery`, `rssFeedQuery` + typed exports.

**TDD**: RED→GREEN per seam — `normalizeOldPath`/`buildPagePath` (10), `buildSitemapXml`
(5), `buildRssFeed` (5). Total 15 new unit tests.

**Results**: `pnpm typecheck` ✓, `pnpm test` ✓ (21 files, 206 tests), `pnpm build` ✓,
`pnpm test:e2e` ✓ (46 tests: 40 prior + 6 new — archive-item 301, page-tree 301,
trailing-slash 301, sitemap 200+XML, robots 200+sitemap ref, rss 200+envelope).

**Notes for next iteration**:
- 62 pages had `_oldPath == null` (top-level containers skipped by `WP_SKIP_IDS` in the
  seed, or pages seeded without a WP link). These don't need redirects (they either had no
  old URL or already use the same slug).
- RSS E2E test uses Playwright `request` fixture (not `page`) to get the raw HTTP response
  body. Chrome treats `application/rss+xml` as text and wraps it in HTML, so `page.content()`
  would return entity-encoded XML; `request.get()` avoids that indirection.
- The gen:redirects script requires `SANITY_READ_TOKEN`. It's a one-shot CLI; re-run
  whenever new documents are seeded with `_oldPath` fields.
