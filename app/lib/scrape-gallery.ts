/**
 * Pure parsing helpers for the NextGEN gallery scrape (issue #3, ADR 0002 + 0003).
 *
 * The WP REST dump renders Digiteka galleries as an `ngg_shortcode` placeholder, so
 * the scrape script (`scripts/scrape-galleries.ts`) fetches each live `/project/`
 * page and feeds its HTML here. Everything in this module is network-free and
 * deterministic — the fetch/throttle/download/disk side effects stay in the script,
 * the URL/breadcrumb logic lives here so it is unit-testable against fixtures.
 *
 * Imported with explicit `.ts` paths by the script so it runs under
 * `node --experimental-strip-types` (no path-alias resolver there).
 */

/** The legacy WordPress-MU host, sometimes served over http; canonical is https www. */
const LEGACY_HOST = /^https?:\/\/(?:www\.)?zal-lj\.splet\.arnes\.si/i

/** Collapse the legacy Arnes host (any scheme) to the canonical https host. */
export function normalizeHost(url: string): string {
  return url.replace(LEGACY_HOST, 'https://www.zal-lj.si')
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i

// WordPress storage roots that hold gallery originals: the WP-MU `blogs.dir`/`files`
// tree NextGEN writes to, plus the classic `uploads`/`gallery` dirs (the Divi
// `et_pb_gallery` on /galerija/ links originals straight out of /files/).
const STORAGE_ROOT = /\/wp-content\/(?:blogs\.dir\/\d+\/files|uploads|gallery)\/|\/files\//i

// Chrome that is an image-href anchor on every page but never a scan: the site logo
// and any derived thumbnail (NextGEN `/thumbs/thumbs_*`).
const NON_SCAN = /thumbs?[_/]|logo/i

/** WordPress resize suffix on a derived size (`Slika-7-400x284.jpg` → `Slika-7.jpg`). */
const RESIZE_SUFFIX = /-\d+x\d+(?=\.[a-z]+$)/i

/** Pull the de-duplicated href of every `<a>` in document order. */
function anchorHrefs(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((m) => m[1])
}

/**
 * Ordered, de-duplicated full-resolution scan URLs from a gallery page's HTML.
 *
 * NextGEN and Divi both render a gallery as anchors whose `href` is the original and
 * whose nested `<img>` is a derived thumbnail/resize — so we take hrefs (the
 * originals), drop the thumbnail and logo chrome, strip any WP resize suffix, and
 * normalise the host. Order is document order; duplicates collapse to first sight.
 */
export function extractGalleryUrls(html: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of anchorHrefs(html)) {
    if (!IMAGE_EXT.test(raw) || !STORAGE_ROOT.test(raw) || NON_SCAN.test(raw)) continue
    const url = normalizeHost(raw).replace(RESIZE_SUFFIX, '')
    if (seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  hellip: '…',
  ndash: '–',
  mdash: '—',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
}

/** Decode the HTML entities WordPress emits (numeric + the handful of named ones). */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
}

/** Strip tags, decode entities, and collapse whitespace to a clean label. */
function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

/** One breadcrumb crumb: a link, or the current page as a hrefless trailing node. */
export type Crumb = { text: string; href: string | null }

/**
 * The ordered breadcrumb of a `/project/` page, parsed from the Divi `breadcrumb_path`
 * module. Each `<a>` becomes a `{text, href}` crumb (host-normalised); the trailing
 * non-link text — the current item — becomes a `{text, href: null}` crumb. Returns an
 * empty list when the page carries no breadcrumb.
 */
export function extractBreadcrumb(html: string): Crumb[] {
  const start = html.search(/breadcrumb_path/i)
  if (start === -1) return []
  const block = html.slice(start).match(/<p>([\s\S]*?)<\/p>/i)
  if (!block) return []
  const inner = block[1]

  const crumbs: Crumb[] = []
  let lastEnd = 0
  for (const m of inner.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    crumbs.push({ text: plainText(m[2]), href: normalizeHost(m[1]) })
    lastEnd = m.index + m[0].length
  }
  // The current item trails the last link as plain text (e.g. "&gt; Cod. I, …").
  const tail = plainText(inner.slice(lastEnd)).replace(/^[\s>›»–-]+/, '')
  if (tail) crumbs.push({ text: tail, href: null })
  return crumbs
}

/** A Digiteka collection derived from the breadcrumb: its label and `/project/` slug. */
export type Collection = { name: string; slug: string }

/** The `/project/<slug>/` slug embedded in a breadcrumb href, if any. */
function projectSlug(href: string | null): string | null {
  const m = href?.match(/\/project\/([^/]+)\//)
  return m ? m[1] : null
}

/**
 * The Digiteka collection a breadcrumb places its item in: the link between "Digiteka"
 * and the current (trailing) item — Domov > Digiteka > <collection> > <item>. Returns
 * null when the item sits directly under Digiteka, or when there is no breadcrumb.
 */
export function breadcrumbToCollection(crumbs: Crumb[]): Collection | null {
  const digiteka = crumbs.findIndex((c) => projectSlug(c.href) === 'digiteka')
  if (digiteka === -1) return null
  // Everything between Digiteka and the trailing current item is the collection chain;
  // the immediate parent (last such crumb) is the collection.
  const parent = crumbs[crumbs.length - 2]
  const idx = crumbs.length - 2
  if (idx <= digiteka) return null
  const slug = projectSlug(parent.href)
  if (!slug) return null
  return { name: parent.text, slug }
}

/**
 * On-disk path (relative to the download root) for a scan: `scans/<slug>/<filename>`.
 * The filename is the URL basename, percent-decoded so it is a real file name. Scans
 * live under a clean per-slug tree rather than mirroring WordPress's blogs.dir layout,
 * so the seed (issue #12) can address them by slug.
 */
export function scanLocalPath(slug: string, sourceUrl: string): string {
  const basename = decodeURIComponent(sourceUrl.split('/').pop() ?? '')
  return `scans/${slug}/${basename}`
}
