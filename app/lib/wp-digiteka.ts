import { extractBreadcrumb } from './scrape-gallery.ts'

export type MetadataPair = { label: string; value: string }

export type WpCollectionInfo = { slug: string; name: string }

export type WpProject = {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  link: string
  status: string
}

export type ArchiveItemSeedDoc = {
  _id: string
  _type: 'archiveItem'
  title: string
  slug: { _type: 'slug'; current: string }
  collection: { _type: 'reference'; _ref: string }
  metadata: Array<{ _key: string; label: string; value: string }>
  gallery: []
  _oldPath: string
}

// The 20 WP project slugs that are Pages (collection landing pages,
// topic pages), excluded from archive items (ADR-0002).
export const WP_PAGE_PROJECT_SLUGS = new Set([
  'i-kaj-je-arhiv',
  'kaj-hranimo',
  'kako-zaceti-raziskavo',
  'arhivski-slovarcek',
  'digiteka',
  'listine-2',
  'listine-iz-zbirke-listin-enota-v-skofji-loki',
  'privilegijska-knjiga-2',
  'popisi-prebivalstva-slovenije-1830-1931-2',
  'zapisniki-sej-mlo-ljubljana-3',
  'seminarji-in-preizkus-strokovne-usposobljenosti',
  'arhivske-delavnice',
  'upravljanje-z-dokumentarnim-gradivom-v-stalni-zbirki',
  'e-arhiviranje',
  'materialno-varstvo-dokumentarnega-in-arhivskega-gradiva',
  'odbiranje-in-izrocanje-javnega-arhivskega-gradiva',
  'izlocanje-in-unicenje-dokumentarnega-gradiva',
  'gradivo-za-zgodovino-ljubljane-v-srednjem-veku-iii',
  'gradivo-za-zgodovino-ljubljane-v-srednjem-veku-iv',
  'gradivo-za-zgodovino-ljubljane-v-srednjem-veku-viii-register-kristofove-bratovscine-v-ljubljani-1489-1518',
])

/** True when the WP project is a Page (collection landing page), not an archive item. */
export function isPageProject(slug: string): boolean {
  return WP_PAGE_PROJECT_SLUGS.has(slug)
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
  scaron: 'š',
  Scaron: 'Š',
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m)
}

/**
 * Extracts strong-tag label/value metadata pairs from WP project HTML.
 * Only labels ending with ":" are included — this discriminates archive-item
 * descriptors (Datum in kraj:, Vsebina:, …) from sidebar/footer strongs
 * (Čitalnica, Sprejemna pisarna). Cuts at id="kontakt" before extracting.
 */
export function extractMetadataPairs(html: string): MetadataPair[] {
  const kontaktIdx = html.indexOf('id="kontakt"')
  const body = kontaktIdx > -1 ? html.slice(0, kontaktIdx) : html

  const pairs: MetadataPair[] = []
  // Match <strong>Label:</strong> followed by value text up to next <strong>, </div>, </p>
  const re = /<strong>([^<]+:)<\/strong>([\s\S]*?)(?=<strong>|<\/div>|<\/p>|$)/g
  for (const m of body.matchAll(re)) {
    const label = decodeEntities(m[1].replace(/:$/, '').trim())
    const value = decodeEntities(
      m[2]
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    if (label && value) pairs.push({ label, value })
  }
  return pairs
}

/**
 * Extracts the slug from a breadcrumb href, handling both /project/slug/
 * and direct-path /slug/ styles used by different ZAL collections.
 */
function collectionSlugFromHref(href: string): string | null {
  // /project/slug/ pattern (most collections)
  const proj = href.match(/\/project\/([^/]+)\//)
  if (proj) return proj[1]
  // Direct-path /slug/ pattern (e.g. /korespondenca_terpinc/)
  const path = href.match(/\/([a-z0-9_-]+)\/?$/i)
  if (path && path[1]) return path[1]
  return null
}

/**
 * Extracts the collection the WP project belongs to from its breadcrumb.
 * Breadcrumb: Domov > Digiteka > {collection} > {current_item}.
 * Handles both /project/slug/ and direct-path collection hrefs.
 * Returns null for items directly under Digiteka or with no breadcrumb.
 */
export function extractCollectionFromBreadcrumb(html: string): WpCollectionInfo | null {
  const crumbs = extractBreadcrumb(html)
  if (crumbs.length < 4) return null

  const digiteka = crumbs.findIndex(
    (c) => c.href != null && c.href.includes('/project/digiteka/'),
  )
  if (digiteka === -1) return null

  // Collection link is the second-to-last crumb (between Digiteka and current item)
  const collCrumb = crumbs[crumbs.length - 2]
  if (!collCrumb.href) return null

  const slug = collectionSlugFromHref(collCrumb.href)
  if (!slug) return null

  return { slug, name: collCrumb.text }
}

let _keyCounter = 0
function nextKey(): string {
  return String(++_keyCounter).padStart(5, '0')
}

/** Stable Sanity ID for an archive item from its WP slug. */
function archiveItemId(slug: string): string {
  const max = 128 - 'archiveItem.'.length
  return `archiveItem.${slug.slice(0, max)}`
}

/**
 * Maps a WP REST project to a Sanity archiveItem seed doc.
 * Gallery is left empty — filled by the scan-upload pass (issue #12).
 */
export function wpProjectToArchiveItemDoc(
  project: WpProject,
  collectionRef: string,
): ArchiveItemSeedDoc {
  const html = project.content.rendered
  const rawPairs = extractMetadataPairs(html)
  const oldPath = new URL(project.link, 'https://www.zal-lj.si').pathname

  return {
    _id: archiveItemId(project.slug),
    _type: 'archiveItem',
    title: decodeEntities(project.title.rendered),
    slug: { _type: 'slug', current: project.slug },
    collection: { _type: 'reference', _ref: collectionRef },
    metadata: rawPairs.map((p) => ({ _key: nextKey(), label: p.label, value: p.value })),
    gallery: [],
    _oldPath: oldPath,
  }
}
