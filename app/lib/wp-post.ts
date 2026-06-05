import { cleanWpHtml, extractTable, splitHtmlSegments } from './wp-html.ts'

import type { PortableTextNode } from './wp-html.ts'
import type { EmbedPageBlock, GalleryPageFigure, GalleryPageBlock, PageBlock, RichTextPageBlock, TablePageBlock } from './wp-page.ts'

export type WpPost = {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  date: string
  link: string
  categories: number[]
  featured_media: number
}

export type PostSeedDoc = {
  _id: string
  _type: 'post'
  title: string
  slug: { _type: 'slug'; current: string }
  date: string
  categories: Array<{ _type: 'reference'; _key: string; _ref: string }>
  mainImage?: { url: string; alt: string }
  blocks: PageBlock[]
  _oldPath: string
}

/**
 * Maps WP category ids to the four canonical Sanity category slugs.
 * nerazvrsceno (id=1) and unknown ids are silently dropped.
 */
export const CATEGORY_COLLAPSE: Record<number, string> = {
  19: 'arhivalija-meseca',      // Arhivalija meseca
  71: 'arhivalija-meseca',      // Arhivalija meseca 2015
  72: 'arhivalija-meseca',      // Arhivalija meseca 2016
  80: 'arhivalija-meseca',      // Arhivalija meseca 2014
  82: 'razstave',               // Razstave
  121: 'obvestila',             // Obvestila
  144: 'dogodki-in-obvestila',  // Dogodki in obvestila
  149: 'arhivalija-meseca',     // Arhivalija meseca 2017
  150: 'arhivalija-meseca',     // Arhivalija meseca 2018
  // id 1 (nerazvrsceno) intentionally absent — dissolves
}

/** Collapse WP category ids to unique canonical slugs in input order. */
export function collapseCategories(ids: number[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    const slug = CATEGORY_COLLAPSE[id]
    if (slug && !seen.has(slug)) {
      seen.add(slug)
      result.push(slug)
    }
  }
  return result
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const ENTITY_RE = /&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&hellip;': '…',
  '&ndash;': '–',
  '&mdash;': '—',
  '&scaron;': 'š',
  '&Scaron;': 'Š',
}

/** Sanity document IDs max 128 chars. Truncate slug to fit. */
function makeSafeId(prefix: string, slug: string): string {
  const maxSlug = 128 - prefix.length
  return `${prefix}${slug.slice(0, maxSlug)}`
}

function decodeTitle(html: string): string {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
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

function makeFigures(
  images: Array<{ url: string; alt: string; caption?: string }>,
  offset: number,
): GalleryPageFigure[] {
  return images.map((img, i) => ({
    _key: `fig-${offset + i}`,
    url: img.url,
    alt: img.alt,
    ...(img.caption ? { caption: img.caption } : {}),
  }))
}

// ── Mapper ────────────────────────────────────────────────────────────────────

/**
 * Map a WP post REST object to a Sanity post seed document.
 * @param post      WP REST post object
 * @param mediaById Map of WP media id → {url, alt} for featured_media resolution
 */
export function wpPostToPostDoc(
  post: WpPost,
  mediaById: Map<number, { url: string; alt: string }>,
): PostSeedDoc {
  const categorySlugs = collapseCategories(post.categories)
  const categories = categorySlugs.map((slug, i) => ({
    _type: 'reference' as const,
    _key: `cat-${i}`,
    _ref: `category.${slug}`,
  }))

  const segments = splitHtmlSegments(post.content.rendered ?? '')
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
        } as TablePageBlock)
      }
    } else if (segment.kind === 'embed') {
      blocks.push({
        _type: 'embedBlock',
        _key: `eb-${blocks.length}`,
        url: segment.src,
      } as EmbedPageBlock)
    } else if (segment.kind === 'gallery') {
      if (segment.images.length > 0) {
        blocks.push({
          _type: 'galleryBlock',
          _key: `gb-${blocks.length}`,
          figures: makeFigures(segment.images, figOffset),
        } as GalleryPageBlock)
        figOffset += segment.images.length
      }
    } else if (segment.kind !== 'ngg') {
      const { portableText } = cleanWpHtml(segment.html)
      if (portableText.length > 0) {
        blocks.push({
          _type: 'richTextBlock',
          _key: `rtb-${blocks.length}`,
          body: portableText as PortableTextNode[],
        } as RichTextPageBlock)
      }
    }
  }

  if (blocks.length === 0) {
    blocks.push({ _type: 'richTextBlock', _key: 'rtb-0', body: [] } as RichTextPageBlock)
  }

  const mainImage =
    post.featured_media > 0 ? mediaById.get(post.featured_media) : undefined

  const doc: PostSeedDoc = {
    _id: makeSafeId('post.', post.slug),
    _type: 'post',
    title: decodeTitle(post.title.rendered),
    slug: { _type: 'slug', current: post.slug },
    date: post.date,
    categories,
    blocks,
    _oldPath: oldPathFromLink(post.link),
  }

  if (mainImage) {
    doc.mainImage = mainImage
  }

  return doc
}
