/**
 * Pure WP HTML cleaner for the ZAL seed. Adapts the letece-kele wp-body pattern
 * with ZAL-specific preprocessing:
 *   - cutDiviFooter: strips the Divi footer section baked into content.rendered
 *   - normalizeHost: zal-lj.splet.arnes.si → www.zal-lj.si
 *   - Divi [et_pb_*] shortcode stripping
 *
 * No network, no DOM — fully unit-testable.
 */

export type PortableTextSpan = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

export type LinkMarkDef = {
  _key: string
  _type: 'link'
  href: string
}

export type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: string
  markDefs: LinkMarkDef[]
  children: PortableTextSpan[]
  listItem?: 'bullet' | 'number'
  level?: number
}

export type PortableTextFigure = {
  _type: 'figure'
  _key: string
  url: string
  alt: string
  caption?: string
}

export type PortableTextNode = PortableTextBlock | PortableTextFigure

export type GalleryImage = {
  src: string
  alt: string
  caption?: string
}

export type CleanedWpHtml = {
  portableText: PortableTextNode[]
  gallery: GalleryImage[]
}

// ── ZAL-specific preprocessing ───────────────────────────────────────────────

const ARNES_HOST_RE = /https?:\/\/zal-lj\.splet\.arnes\.si/gi

/** Replace the old Arnes host with the canonical www host. */
export function normalizeHost(url: string): string {
  return url.replace(ARNES_HOST_RE, 'https://www.zal-lj.si')
}

/** Cut at the Divi footer section div (baked into content.rendered by Divi). */
export function cutDiviFooter(html: string): string {
  const idx = html.search(/<div[^>]+id\s*=\s*["']kontakt["']/i)
  return idx >= 0 ? html.slice(0, idx) : html
}

// ── Entity decoding ───────────────────────────────────────────────────────────

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

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&[a-zA-Z]+;/g, (m) => ENTITIES[m] ?? m)
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'),
  )
  return m ? (m[2] ?? m[3]) : undefined
}

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

function styleFor(tag: string): string {
  const t = tag.toLowerCase()
  if (HEADINGS.has(t)) return t
  if (t === 'blockquote') return 'blockquote'
  return 'normal'
}

function parseInline(
  inner: string,
  blockKey: string,
): { children: PortableTextSpan[]; markDefs: LinkMarkDef[] } {
  const children: PortableTextSpan[] = []
  const markDefs: LinkMarkDef[] = []
  const stack: string[] = []
  let linkCount = 0
  let spanCount = 0

  const pushText = (raw: string) => {
    const text = decodeEntities(raw).replace(/\s+/g, ' ')
    if (!text) return
    children.push({
      _type: 'span',
      _key: `${blockKey}s${spanCount++}`,
      text,
      marks: [...stack],
    })
  }

  const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)\/?>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = TAG_RE.exec(inner))) {
    pushText(inner.slice(last, m.index))
    last = TAG_RE.lastIndex
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()

    if (tag === 'br') {
      pushText(' ')
      continue
    }

    const decorator =
      tag === 'strong' || tag === 'b'
        ? 'strong'
        : tag === 'em' || tag === 'i'
          ? 'em'
          : null

    if (decorator) {
      if (closing) {
        const i = stack.lastIndexOf(decorator)
        if (i >= 0) stack.splice(i, 1)
      } else {
        stack.push(decorator)
      }
    } else if (tag === 'a') {
      if (closing) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].startsWith(`${blockKey}l`)) {
            stack.splice(i, 1)
            break
          }
        }
      } else {
        const rawHref = attr(m[0], 'href')
        if (rawHref) {
          const href = normalizeHost(decodeEntities(rawHref))
          const k = `${blockKey}l${linkCount++}`
          markDefs.push({ _key: k, _type: 'link', href })
          stack.push(k)
        }
      }
    }
  }
  pushText(inner.slice(last))

  if (children.length > 0) {
    children[0].text = children[0].text.replace(/^\s+/, '')
    children[children.length - 1].text = children[children.length - 1].text.replace(
      /\s+$/,
      '',
    )
  }
  const kept = children.filter((c) => c.text !== '')
  const used = new Set(kept.flatMap((c) => c.marks))
  return { children: kept, markDefs: markDefs.filter((d) => used.has(d._key)) }
}

const IMG_RE = /<img\b[^>]*>/gi

function realImage(src: string | undefined): src is string {
  return Boolean(src) && !src!.includes('/wp-includes/')
}

function fullSizeImage(src: string): string {
  return src.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/, '$1')
}

function imageSrc(tag: string): string | undefined {
  const full = attr(tag, 'data-full-url')
  if (realImage(full)) return normalizeHost(fullSizeImage(full))
  const src = attr(tag, 'src')
  return realImage(src) ? normalizeHost(fullSizeImage(src)) : undefined
}

const FIGCAPTION_RE = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i

function captionOf(liInner: string): string | undefined {
  const m = liInner.match(FIGCAPTION_RE)
  if (!m) return undefined
  const text = decodeEntities(m[1].replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  return text || undefined
}

const NODE_RE =
  /<(h[1-6]|p|blockquote|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*>/gi

const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi

/** Parse WP page HTML into Portable Text nodes and a gallery list. */
export function cleanWpHtml(html: string | null | undefined): CleanedWpHtml {
  const gallery: GalleryImage[] = []
  const blocks: PortableTextNode[] = []
  if (!html) return { portableText: blocks, gallery }

  const s = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\[gallery\b[^\]]*\]/gi, '')
    .replace(/\[et_pb_[^\]]*\]/gi, '')
    .replace(/\[\/et_pb_[^\]]*\]/gi, '')

  const emitFigure = (tag: string, caption?: string) => {
    const src = imageSrc(tag)
    if (!src) return
    const alt = attr(tag, 'alt') ?? ''
    gallery.push({ src, alt, ...(caption ? { caption } : {}) })
    blocks.push({
      _type: 'figure',
      _key: `b${blocks.length}`,
      url: src,
      alt,
      ...(caption ? { caption } : {}),
    })
  }

  const emitProse = (style: string, inner: string) => {
    IMG_RE.lastIndex = 0
    let last = 0
    let m: RegExpExecArray | null
    const emitText = (raw: string) => {
      const blockKey = `b${blocks.length}`
      const { children, markDefs } = parseInline(raw, blockKey)
      if (children.length > 0) {
        blocks.push({ _type: 'block', _key: blockKey, style, markDefs, children })
      }
    }
    while ((m = IMG_RE.exec(inner))) {
      emitText(inner.slice(last, m.index))
      emitFigure(m[0])
      last = IMG_RE.lastIndex
    }
    emitText(inner.slice(last))
  }

  const emitList = (listItem: 'bullet' | 'number', inner: string) => {
    LI_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = LI_RE.exec(inner))) {
      const li = m[1]
      const imgs = li.match(IMG_RE)
      if (imgs) {
        const caption = captionOf(li)
        for (const tag of imgs) emitFigure(tag, caption)
        continue
      }
      const blockKey = `b${blocks.length}`
      const { children, markDefs } = parseInline(li, blockKey)
      if (children.length > 0) {
        blocks.push({
          _type: 'block',
          _key: blockKey,
          style: 'normal',
          listItem,
          level: 1,
          markDefs,
          children,
        })
      }
    }
  }

  const matches = [...s.matchAll(NODE_RE)]
  if (matches.length > 0) {
    for (const m of matches) {
      if (m[1] === undefined) {
        emitFigure(m[0])
        continue
      }
      const tag = m[1].toLowerCase()
      const inner = m[2]
      if (tag === 'ul') emitList('bullet', inner)
      else if (tag === 'ol') emitList('number', inner)
      else emitProse(styleFor(tag), inner)
    }
  } else {
    for (const chunk of s.split(/\n\s*\n/)) emitProse('normal', chunk)
  }

  return { portableText: blocks, gallery }
}
