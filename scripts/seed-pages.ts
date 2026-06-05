/**
 * Seed Sanity with all WP pages + sitemap-linked content projects as Page documents.
 *
 * Run: node --experimental-strip-types scripts/seed-pages.ts
 * Flags:
 *   SEED_FORCE=1   always createOrReplace (ignore existing Sanity edits)
 *   SEED_DRY=1     print docs without writing to Sanity
 *
 * Idempotency: createOrReplace with stable _ids (page.{slug}).
 * Inline images: uploaded once per URL via a url→assetId memo; re-runs skip.
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'

import { cleanSlugForPage, WP_SKIP_IDS, wpPageToPageDoc } from '../app/lib/wp-page.ts'
import { cutDiviFooter } from '../app/lib/wp-html.ts'
import type { PortableTextNode } from '../app/lib/wp-html.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Sanity client ────────────────────────────────────────────────────────────

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const dry = process.env.SEED_DRY === '1'

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token && !dry) throw new Error('SANITY_WRITE_TOKEN not set')

const client = createClient({ projectId, dataset, token: token ?? '', apiVersion, useCdn: false })

// ── Load WP data ─────────────────────────────────────────────────────────────

type WpPage = {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  parent: number
  link: string
  status: string
}

type WpProject = {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  link: string
  status: string
  categories: number[]
}

const pages: WpPage[] = JSON.parse(
  readFileSync(join(ROOT, '../download/content/pages.json'), 'utf-8'),
)
const projects: WpProject[] = JSON.parse(
  readFileSync(join(ROOT, '../download/content/projects.json'), 'utf-8'),
)

// ── WP page id=1793 is the "domaca-stran-1" container — children of it are
// ── treated as root-level pages; pages at parent=0 outside it are also root.
const DOMACA_STRAN_ID = 1793

// ── Sitemap content projects (non-digiteka) to seed as Pages ──────────────────
// Digiteka items (listine, popisi, zapisniki, etc.) are seeded in issue #11.

const CONTENT_PROJECTS: Record<string, { parent: string | null }> = {
  // Informational pages under /za-uporabnike
  'i-kaj-je-arhiv': { parent: 'page.za-uporabnike' },
  'kaj-hranimo': { parent: 'page.za-uporabnike' },
  'kako-zaceti-raziskavo': { parent: 'page.za-uporabnike' },
  'arhivski-slovarcek': { parent: 'page.za-uporabnike' },
  // Professional training under /za-ustvarjalce
  'seminarji-in-preizkus-strokovne-usposobljenosti': { parent: 'page.za-ustvarjalce' },
  'arhivske-delavnice': { parent: 'page.za-ustvarjalce' },
  // Document management guidance under /za-ustvarjalce
  'upravljanje-z-dokumentarnim-gradivom-v-stalni-zbirki': { parent: 'page.za-ustvarjalce' },
  'e-arhiviranje': { parent: 'page.za-ustvarjalce' },
  'materialno-varstvo-dokumentarnega-in-arhivskega-gradiva': { parent: 'page.za-ustvarjalce' },
  'odbiranje-in-izrocanje-javnega-arhivskega-gradiva': { parent: 'page.za-ustvarjalce' },
  'izlocanje-in-unicenje-dokumentarnega-gradiva': { parent: 'page.za-ustvarjalce' },
  // Medieval Ljubljana publications under /publikacije
  'gradivo-za-zgodovino-ljubljane-v-srednjem-veku-iii': { parent: 'page.publikacije' },
  'gradivo-za-zgodovino-ljubljane-v-srednjem-veku-iv': { parent: 'page.publikacije' },
  'gradivo-za-zgodovino-ljubljane-v-srednjem-veku-viii-register-kristofove-bratovscine-v-ljubljani-1489-1518': { parent: 'page.publikacije' },
}

// ── Image upload memo (URL → Sanity asset _id) ───────────────────────────────

const assetByUrl = new Map<string, string>()

async function uploadImage(url: string, alt: string): Promise<string | null> {
  if (dry) return null  // skip uploads in dry-run mode
  const cached = assetByUrl.get(url)
  if (cached) return cached

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) {
      console.warn(`  [upload] ${res.status} ${url}`)
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const filename = url.split('/').pop()?.split('?')[0] ?? 'image.jpg'
    const asset = await client.assets.upload('image', buffer, {
      filename,
      label: alt,
    })
    assetByUrl.set(url, asset._id)
    return asset._id
  } catch (err) {
    console.warn(`  [upload] failed ${url}: ${(err as Error).message}`)
    return null
  }
}

// ── Replace figure.url nodes with real asset refs ────────────────────────────

type FigureNode = {
  _type: 'figure'
  _key: string
  url: string
  alt: string
  caption?: string
}

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
      // skip figures where upload failed
    } else {
      out.push(node as ResolvedNode)
    }
  }
  return out
}

// ── Build WP page slug → clean slug + Sanity _id map ─────────────────────────

function buildSlugMap(allPages: WpPage[]) {
  const cleanSlugs = new Map<number, string>()
  for (const p of allPages) {
    cleanSlugs.set(p.id, cleanSlugForPage(p.id, p.slug))
  }

  const byId = new Map<number, WpPage>()
  for (const p of allPages) byId.set(p.id, p)

  function parentRefFor(wpParentId: number): string | null {
    if (wpParentId === 0 || wpParentId === DOMACA_STRAN_ID) return null
    const parentSlug = cleanSlugs.get(wpParentId)
    return parentSlug ? `page.${parentSlug}` : null
  }

  /** Compute ancestor depth (0 = root, 1 = child of root, …). */
  function depthOf(p: WpPage, visited = new Set<number>()): number {
    if (visited.has(p.id)) return 0
    visited.add(p.id)
    if (p.parent === 0 || p.parent === DOMACA_STRAN_ID) return 0
    const parentPage = byId.get(p.parent)
    if (!parentPage) return 0
    return 1 + depthOf(parentPage, visited)
  }

  return { cleanSlugs, parentRefFor, depthOf }
}

// ── Build final seed doc with resolved image assets ──────────────────────────

async function buildSeedDoc(
  wpPage: WpPage,
  cleanSlug: string,
  parentRef: string | null,
) {
  const mapped = wpPageToPageDoc(wpPage, cleanSlug, parentRef)
  const block = mapped.blocks[0]
  const resolvedBody = block?.body.length
    ? await resolveBodyFigures(block.body as PortableTextNode[])
    : (block?.body ?? [])
  return {
    ...mapped,
    blocks: block ? [{ ...block, body: resolvedBody }] : [],
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const { cleanSlugs, parentRefFor, depthOf } = buildSlugMap(pages)

  const publishedPages = pages
    .filter((p) => p.status === 'publish' && !WP_SKIP_IDS.has(p.id))
    .sort((a, b) => depthOf(a) - depthOf(b))  // parents before children

  console.log(
    `[seed-pages] ${publishedPages.length} WP pages + ${Object.keys(CONTENT_PROJECTS).length} content projects`,
  )

  let count = 0

  // ── Seed WP pages ────────────────────────────────────────────────────────────
  for (const wpPage of publishedPages) {
    const cleanSlug = cleanSlugs.get(wpPage.id) ?? wpPage.slug
    const parentRef = parentRefFor(wpPage.parent)
    const cutPage = { ...wpPage, content: { rendered: cutDiviFooter(wpPage.content.rendered) } }
    const doc = await buildSeedDoc(cutPage, cleanSlug, parentRef)

    if (dry) {
      console.log(`[dry] ${doc._id} parent=${doc.parent?._ref ?? 'root'}`)
    } else {
      await client.createOrReplace(doc)
      if (++count % 10 === 0) console.log(`  [seed-pages] ${count} pages written…`)
    }
  }

  // ── Seed content projects ─────────────────────────────────────────────────
  for (const [slug, { parent }] of Object.entries(CONTENT_PROJECTS)) {
    const project = projects.find((p) => p.slug === slug)
    if (!project) {
      console.warn(`  [seed-pages] project slug "${slug}" not found in projects.json`)
      continue
    }

    const wpPage: WpPage = {
      id: project.id,
      slug: project.slug,
      title: project.title,
      content: { rendered: cutDiviFooter(project.content.rendered) },
      parent: 0,
      link: project.link,
      status: project.status,
    }

    const doc = await buildSeedDoc(wpPage, slug, parent)

    if (dry) {
      console.log(`[dry] ${doc._id} parent=${parent ?? 'root'}`)
    } else {
      await client.createOrReplace(doc)
      count++
    }
  }

  console.log(
    `[seed-pages] done. ${dry ? '(dry run)' : `${count} documents written.`}`,
  )
}

run().catch((err) => {
  console.error('[seed-pages] failed:', err)
  process.exit(1)
})
