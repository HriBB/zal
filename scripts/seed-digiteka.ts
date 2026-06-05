/**
 * Seed Sanity with Digiteka collections and archive items from the WP REST dump.
 *
 * Run: node --experimental-strip-types scripts/seed-digiteka.ts
 * Flags:
 *   SEED_FORCE=1   createOrReplace (overwrites editor edits)
 *   SEED_DRY=1     print docs without writing to Sanity
 *
 * Idempotency:
 *   - stable _ids: collection.{slug}, archiveItem.{slug}
 *   - default: createOrReplace (migrated content, not editor-authored)
 *
 * Coverage: seeds 4 collections detected from WP breadcrumbs.
 * Items with no detectable collection (~179) are skipped. Full coverage
 * requires the gallery scrape (pnpm scrape) for the breadcrumb map.
 */

import 'dotenv/config'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'

import {
  extractCollectionFromBreadcrumb,
  isPageProject,
  wpProjectToArchiveItemDoc,
} from '../app/lib/wp-digiteka.ts'
import type { WpProject } from '../app/lib/wp-digiteka.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const dry = process.env.SEED_DRY === '1'
const force = process.env.SEED_FORCE !== '0' // default createOrReplace for migrated content

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token && !dry) throw new Error('SANITY_WRITE_TOKEN not set')

const client = createClient({ projectId, dataset, token: token ?? '', apiVersion, useCdn: false })

// ── Load WP REST dump ────────────────────────────────────────────────────────

const downloadDir = join(__dirname, '../../download')
const projects: WpProject[] = JSON.parse(
  readFileSync(join(downloadDir, 'content/projects.json'), 'utf8'),
)

console.log(`Loaded ${projects.length} WP projects`)

// ── Hardcoded collection metadata ────────────────────────────────────────────
// Derived from WP breadcrumb analysis. Names normalised from sitemap page titles.

type CollectionDef = {
  slug: string
  name: string
  description?: string
  _oldPath?: string
}

const COLLECTION_DEFS: CollectionDef[] = [
  {
    slug: 'kodeksi',
    name: 'Zapisniki ljubljanskega mestnega sveta, 1521–1682',
    _oldPath: '/project/kodeksi/',
  },
  {
    slug: 'korespondenca_terpinc',
    name: 'Korespondenca Jožefine in Fidelija Terpinc 1825-1858',
    _oldPath: '/korespondenca_terpinc/',
  },
  {
    slug: 'listine',
    name: 'Listine iz Zbirke listin (Enota v Ljubljani), 1320–1955',
    _oldPath: '/project/listine/',
  },
  {
    slug: 'listine-iz-zbirke-listin-enota-v-skofji-loki',
    name: 'Listine iz Zbirke listin (Enota v Škofji Loki), 1504–1842',
    _oldPath: '/project/listine-iz-zbirke-listin-enota-v-skofji-loki/',
  },
]

// ── Seed collections ─────────────────────────────────────────────────────────

console.log(`\nSeeding ${COLLECTION_DEFS.length} collections…`)

let collectionOk = 0
const collectionIdBySlug = new Map<string, string>()

for (const def of COLLECTION_DEFS) {
  const id = `collection.${def.slug}`
  collectionIdBySlug.set(def.slug, id)

  const doc = {
    _id: id,
    _type: 'collection' as const,
    name: def.name,
    slug: { _type: 'slug' as const, current: def.slug },
    ...(def.description ? { description: def.description } : {}),
    ...(def._oldPath ? { _oldPath: def._oldPath } : {}),
  }

  if (dry) {
    console.log(`  [dry] collection.${def.slug}`)
    collectionOk++
    continue
  }

  try {
    await client.createOrReplace(doc)
    collectionOk++
    console.log(`  ✓ collection.${def.slug}`)
  } catch (err) {
    console.error(`  ✗ collection.${def.slug}:`, (err as Error).message)
  }
}

console.log(`Collections: ${collectionOk}/${COLLECTION_DEFS.length} seeded`)

// ── Seed archive items ────────────────────────────────────────────────────────

console.log(`\nSeeding archive items…`)

let itemOk = 0
let itemSkipped = 0
let itemFailed = 0

for (const project of projects) {
  // Skip sitemap-linked Pages
  if (isPageProject(project.slug)) {
    itemSkipped++
    continue
  }

  // Extract collection from WP HTML breadcrumb
  const coll = extractCollectionFromBreadcrumb(project.content.rendered)
  if (!coll) {
    itemSkipped++
    continue
  }

  const collectionId = collectionIdBySlug.get(coll.slug)
  if (!collectionId) {
    // Unknown collection (breadcrumb references a collection not in our list)
    itemSkipped++
    continue
  }

  const doc = wpProjectToArchiveItemDoc(project, collectionId)

  if (dry) {
    console.log(`  [dry] ${doc._id} (${coll.slug})`)
    itemOk++
    continue
  }

  try {
    await client.createOrReplace(doc)
    itemOk++
    if (itemOk % 50 === 0) console.log(`  … ${itemOk} items written`)
  } catch (err) {
    itemFailed++
    console.error(`  ✗ ${doc._id}:`, (err as Error).message)
  }
}

console.log(`\nArchive items: ${itemOk} written, ${itemSkipped} skipped (no collection), ${itemFailed} failed`)
console.log(`\nDone.`)
