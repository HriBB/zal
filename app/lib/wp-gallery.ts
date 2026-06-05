/**
 * Pure helpers for lifting gallery images from Divi et_pb_gallery HTML and
 * resolving NextGEN ngg_shortcode placeholders.
 *
 * No network, no DOM — fully unit-testable.
 */

import type { GalleryImage } from './wp-html.ts'
import { normalizeHost } from './wp-html.ts'

// ── extractInlineGallery ───────────────────────────────────────────────────────

const GALLERY_ITEM_RE =
  /et_pb_gallery_item[\s\S]*?<a\b([^>]*)>([\s\S]*?)<\/a>/gi

function attrVal(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  return m ? (m[2] ?? m[3]) : undefined
}

/**
 * Extract full-size gallery images from Divi et_pb_gallery HTML.
 *
 * Divi renders `et_pb_gallery_item` anchors whose `href` is the original
 * full-size image and whose nested `<img>` is a derived thumbnail resize —
 * so we take hrefs (the originals) and normalise the host.
 */
export function extractInlineGallery(html: string): GalleryImage[] {
  const images: GalleryImage[] = []
  GALLERY_ITEM_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = GALLERY_ITEM_RE.exec(html)) !== null) {
    const anchorAttrs = m[1]
    const anchorInner = m[2]

    const href = attrVal(`<a ${anchorAttrs}>`, 'href')
    if (!href) continue

    const url = normalizeHost(href)

    const imgMatch = anchorInner.match(/<img\b([^>]*)>/i)
    const imgAlt = imgMatch ? (attrVal(imgMatch[0], 'alt') ?? '') : ''
    const title = attrVal(`<a ${anchorAttrs}>`, 'title') ?? ''

    const alt = imgAlt || title

    const image: GalleryImage = { url, alt }
    if (title) image.caption = title
    images.push(image)
  }
  return images
}

// ── nggNth ────────────────────────────────────────────────────────────────────

const NGG_RE = /ngg_shortcode_(\d+)_placeholder/

/**
 * Returns the index N from `ngg_shortcode_N_placeholder`, or null if absent.
 * The index identifies which NextGEN gallery this placeholder refers to.
 */
export function nggNth(text: string): number | null {
  const m = text.match(NGG_RE)
  return m ? Number(m[1]) : null
}
