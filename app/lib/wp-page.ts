import { cleanWpHtml, extractTable, splitHtmlSegments } from './wp-html.ts'

import type { PortableTextNode, WpTableRow } from './wp-html.ts'

export type WpPage = {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  parent: number
  link: string
}

export type RichTextPageBlock = {
  _type: 'richTextBlock'
  _key: string
  body: PortableTextNode[]
}

export type TablePageBlock = {
  _type: 'tableBlock'
  _key: string
  rows: WpTableRow[]
}

export type EmbedPageBlock = {
  _type: 'embedBlock'
  _key: string
  url: string
}

export type GalleryPageFigure = {
  _key: string
  url: string
  alt: string
  caption?: string
}

export type GalleryPageBlock = {
  _type: 'galleryBlock'
  _key: string
  figures: GalleryPageFigure[]
}

export type PageBlock = RichTextPageBlock | TablePageBlock | EmbedPageBlock | GalleryPageBlock

export type PageSeedDoc = {
  _id: string
  _type: 'page'
  title: string
  slug: { _type: 'slug'; current: string }
  parent?: { _type: 'reference'; _ref: string }
  _oldPath: string
  blocks: PageBlock[]
}

/** Explicit clean slug overrides for WP section pages with numeric suffixes. */
export const WP_CLEAN_SLUG: Record<number, string> = {
  3987: 'o-arhivu',
  3997: 'za-uporabnike',
  3990: 'za-ustvarjalce',
  3992: 'publikacije',
  3995: 'aktualno',
}

/** WP page ids to skip (containers, test pages, auto-generated pages). */
export const WP_SKIP_IDS = new Set([
  1793, // domaca-stran-1: root nav container
  1743, // zemljevid-strani: WP sitemap page
  7673, // noga: Divi footer page
  44017, // testna-stran: test page
])

/** Return the canonical clean slug for a WP page (strips numeric suffixes). */
export function cleanSlugForPage(wpId: number, wpSlug: string): string {
  return WP_CLEAN_SLUG[wpId] ?? wpSlug
}

const ENTITY_RE = /&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&scaron;': 'š',
  '&Scaron;': 'Š',
}

function decodeTitle(html: string): string {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(ENTITY_RE, (m) => ENTITIES[m] ?? m)
    .trim()
}

function oldPathFromLink(link: string): string {
  try {
    return new URL(link).pathname
  } catch {
    return link
  }
}

type GalleriesData = Record<string, { scans: Array<{ sourceUrl: string; localPath: string }> }>

function makeFigures(images: Array<{ url: string; alt: string; caption?: string }>, offset: number): GalleryPageFigure[] {
  return images.map((img, i) => ({
    _key: `fig-${offset + i}`,
    url: img.url,
    alt: img.alt,
    ...(img.caption ? { caption: img.caption } : {}),
  }))
}

/**
 * Map a WP page REST object to a Sanity page seed document.
 * @param page      WP REST page object
 * @param cleanSlug Pre-computed clean slug for this page
 * @param parentRef Sanity _id of the parent page, or null for top-level
 * @param galleries Optional galleries.json data for resolving ngg placeholders
 */
export function wpPageToPageDoc(
  page: WpPage,
  cleanSlug: string,
  parentRef: string | null,
  galleries?: GalleriesData,
): PageSeedDoc {
  const segments = splitHtmlSegments(page.content.rendered ?? '')
  const blocks: PageBlock[] = []
  let figOffset = 0

  for (const segment of segments) {
    if (segment.kind === 'table') {
      const tableData = extractTable(segment.html)
      if (tableData.rows.length > 0) {
        blocks.push({
          _type: 'tableBlock',
          _key: `tb-${blocks.length}`,
          rows: tableData.rows,
        })
      }
    } else if (segment.kind === 'embed') {
      blocks.push({
        _type: 'embedBlock',
        _key: `eb-${blocks.length}`,
        url: segment.src,
      })
    } else if (segment.kind === 'gallery') {
      if (segment.images.length > 0) {
        blocks.push({
          _type: 'galleryBlock',
          _key: `gb-${blocks.length}`,
          figures: makeFigures(segment.images, figOffset),
        })
        figOffset += segment.images.length
      }
    } else if (segment.kind === 'ngg') {
      const entry = galleries?.[cleanSlug]
      const scans = entry?.scans ?? []
      if (scans.length > 0) {
        blocks.push({
          _type: 'galleryBlock',
          _key: `gb-${blocks.length}`,
          figures: makeFigures(
            scans.map((s) => ({ url: s.sourceUrl, alt: '' })),
            figOffset,
          ),
        })
        figOffset += scans.length
      }
    } else {
      const { portableText } = cleanWpHtml(segment.html)
      if (portableText.length > 0) {
        blocks.push({
          _type: 'richTextBlock',
          _key: `rtb-${blocks.length}`,
          body: portableText,
        })
      }
    }
  }

  // Ensure at least one block (empty richTextBlock for pages with no content)
  if (blocks.length === 0) {
    blocks.push({ _type: 'richTextBlock', _key: 'rtb-0', body: [] })
  }

  const doc: PageSeedDoc = {
    _id: `page.${cleanSlug}`,
    _type: 'page',
    title: decodeTitle(page.title.rendered),
    slug: { _type: 'slug', current: cleanSlug },
    _oldPath: oldPathFromLink(page.link),
    blocks,
  }

  if (parentRef) {
    doc.parent = { _type: 'reference', _ref: parentRef }
  }

  return doc
}
