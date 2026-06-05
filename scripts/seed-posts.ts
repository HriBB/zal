/**
 * Seed Sanity with the 4 canonical categories and all 311 WP posts.
 *
 * Run: node --experimental-strip-types scripts/seed-posts.ts
 * Flags:
 *   SEED_FORCE=1   always createOrReplace (ignore existing Sanity edits)
 *   SEED_DRY=1     print docs without writing to Sanity
 *
 * Idempotency:
 *   - categories: stable _ids (category.{slug}); createOrReplace always
 *   - posts:      stable _ids (post.{slug}); createOrReplace always
 *   - mainImage:  url → assetId memo kept in-memory (not persisted, re-upload on re-run)
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'

import { cutDiviFooter } from '../app/lib/wp-html.ts'
import { wpPostToPostDoc } from '../app/lib/wp-post.ts'
import type { PostSeedDoc } from '../app/lib/wp-post.ts'
import type { PortableTextNode } from '../app/lib/wp-html.ts'
import type { RichTextPageBlock, GalleryPageBlock, GalleryPageFigure } from '../app/lib/wp-page.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DOWNLOAD_ROOT = join(ROOT, '../download')

// ── Sanity client ─────────────────────────────────────────────────────────────

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const dry = process.env.SEED_DRY === '1'

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token && !dry) throw new Error('SANITY_WRITE_TOKEN not set')

const client = createClient({ projectId, dataset, token: token ?? '', apiVersion, useCdn: false })

// ── Load WP data ──────────────────────────────────────────────────────────────

type WpPostRaw = {
  id: number
  slug: string
  status: string
  title: { rendered: string }
  content: { rendered: string }
  date: string
  link: string
  categories: number[]
  featured_media: number
}

type WpMediaRaw = {
  id: number
  alt_text: string
  source_url: string
}

const posts: WpPostRaw[] = JSON.parse(
  readFileSync(join(DOWNLOAD_ROOT, 'content/posts.json'), 'utf-8'),
)
const media: WpMediaRaw[] = JSON.parse(
  readFileSync(join(DOWNLOAD_ROOT, 'content/media.json'), 'utf-8'),
)

// ── Build mediaById lookup ────────────────────────────────────────────────────

const mediaById = new Map<number, { url: string; alt: string }>()
for (const m of media) {
  mediaById.set(m.id, { url: m.source_url, alt: m.alt_text ?? '' })
}

// ── Four canonical categories ─────────────────────────────────────────────────

const CANONICAL_CATEGORIES = [
  { slug: 'arhivalija-meseca', title: 'Arhivalija meseca' },
  { slug: 'dogodki-in-obvestila', title: 'Dogodki in obvestila' },
  { slug: 'obvestila', title: 'Obvestila' },
  { slug: 'razstave', title: 'Razstave' },
]

// ── Image upload memo (URL → Sanity asset _id, in-memory) ────────────────────

const assetByUrl = new Map<string, string>()

async function uploadImage(url: string, alt: string): Promise<string | null> {
  if (dry) return null
  const cached = assetByUrl.get(url)
  if (cached) return cached

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) {
      console.warn(`  [upload] ${res.status} ${url}`)
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const filename = basename(url.split('?')[0]!)
    const asset = await client.assets.upload('image', buffer, { filename, label: alt })
    assetByUrl.set(url, asset._id)
    return asset._id
  } catch (err) {
    console.warn(`  [upload] failed ${url}: ${(err as Error).message}`)
    return null
  }
}

// ── Resolve body figures ──────────────────────────────────────────────────────

type FigureNode = { _type: 'figure'; _key: string; url: string; alt: string; caption?: string }
type ResolvedNode = Record<string, unknown>

async function resolveBodyFigures(body: PortableTextNode[]): Promise<ResolvedNode[]> {
  const out: ResolvedNode[] = []
  for (const node of body) {
    if (node._type === 'figure') {
      const fig = node as FigureNode
      const assetId = await uploadImage(fig.url, fig.alt)
      if (assetId) {
        out.push({
          _type: 'figure',
          _key: fig._key,
          asset: { _type: 'reference', _ref: assetId },
          alt: fig.alt,
          ...(fig.caption ? { caption: fig.caption } : {}),
        })
      }
    } else {
      out.push(node as ResolvedNode)
    }
  }
  return out
}

// ── Resolve gallery figures ───────────────────────────────────────────────────

async function resolveGalleryFigures(figures: GalleryPageFigure[]): Promise<ResolvedNode[]> {
  const out: ResolvedNode[] = []
  for (const fig of figures) {
    const assetId = await uploadImage(fig.url, fig.alt)
    if (assetId) {
      out.push({
        _type: 'figure',
        _key: fig._key,
        asset: { _type: 'reference', _ref: assetId },
        alt: fig.alt || ' ',
        ...(fig.caption ? { caption: fig.caption } : {}),
      })
    }
  }
  return out
}

// ── Build final doc with resolved images ──────────────────────────────────────

async function buildDoc(mapped: PostSeedDoc): Promise<Record<string, unknown>> {
  const blocks: ResolvedNode[] = []

  for (const block of mapped.blocks) {
    if (block._type === 'richTextBlock') {
      const rtb = block as RichTextPageBlock
      const body = rtb.body as PortableTextNode[]
      const resolvedBody = body.length ? await resolveBodyFigures(body) : body
      blocks.push({ ...rtb, body: resolvedBody })
    } else if (block._type === 'galleryBlock') {
      const gb = block as GalleryPageBlock
      const resolvedFigures = await resolveGalleryFigures(gb.figures)
      if (resolvedFigures.length > 0) {
        blocks.push({ ...gb, figures: resolvedFigures })
      }
    } else {
      blocks.push(block as ResolvedNode)
    }
  }

  // Resolve mainImage
  let mainImage: Record<string, unknown> | undefined
  if (mapped.mainImage) {
    const assetId = await uploadImage(mapped.mainImage.url, mapped.mainImage.alt)
    if (assetId) {
      mainImage = {
        _type: 'figure',
        asset: { _type: 'reference', _ref: assetId },
        alt: mapped.mainImage.alt,
      }
    }
  }

  return {
    ...mapped,
    ...(mainImage ? { mainImage } : { mainImage: undefined }),
    blocks,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  // 1. Seed canonical categories
  console.log('[seed-posts] seeding 4 canonical categories…')
  for (const cat of CANONICAL_CATEGORIES) {
    const doc = {
      _id: `category.${cat.slug}`,
      _type: 'category',
      title: cat.title,
      slug: { _type: 'slug', current: cat.slug },
    }
    if (dry) {
      console.log(`[dry] category ${doc._id}`)
    } else {
      await client.createOrReplace(doc)
    }
  }

  // 2. Seed posts
  const publishedPosts = posts.filter((p) => p.status === 'publish')
  console.log(`[seed-posts] seeding ${publishedPosts.length} posts…`)

  let count = 0
  for (const rawPost of publishedPosts) {
    const wpPost = {
      ...rawPost,
      content: { rendered: cutDiviFooter(rawPost.content.rendered) },
    }
    const mapped = wpPostToPostDoc(wpPost, mediaById)
    const doc = await buildDoc(mapped)

    if (dry) {
      console.log(`[dry] post ${doc._id as string} cats=${mapped.categories.map((c) => c._ref).join(',')}`)
    } else {
      await client.createOrReplace(doc as Parameters<typeof client.createOrReplace>[0])
      if (++count % 20 === 0) console.log(`  [seed-posts] ${count} posts written…`)
    }
  }

  console.log(
    `[seed-posts] done. ${dry ? '(dry run)' : `4 categories + ${count} posts written.`}`,
  )
}

run().catch((err) => {
  console.error('[seed-posts] failed:', err)
  process.exit(1)
})
