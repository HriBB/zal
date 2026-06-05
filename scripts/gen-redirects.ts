/**
 * Generate app/data/redirects.json from Sanity _oldPath fields.
 *
 * Run: node --experimental-strip-types scripts/gen-redirects.ts
 *
 * Maps every migrated WP path (pages, posts, archive items, collections)
 * to its clean new path. The catch-all page route reads this artifact and
 * issues 301s before falling through to 404 (ADR-0003).
 */

import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'

import { buildPagePath, normalizeOldPath } from '../app/lib/redirects.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_READ_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token) throw new Error('SANITY_READ_TOKEN not set')

const client = createClient({ projectId, dataset, token, apiVersion, useCdn: false })

type PageRow = {
  _oldPath: string | null
  slug: string
  parentSlug: string | null
  grandParentSlug: string | null
  greatGrandParentSlug: string | null
}

type PostRow = {
  _oldPath: string | null
  slug: string
}

type ArchiveItemRow = {
  _oldPath: string | null
  slug: string
  collectionSlug: string
}

type CollectionRow = {
  _oldPath: string | null
  slug: string
}

const redirects: Record<string, string> = {}
let added = 0

function add(oldPath: string | null | undefined, newPath: string) {
  if (!oldPath) return
  const normalised = normalizeOldPath(oldPath)
  if (!normalised || normalised === newPath) return
  redirects[normalised] = newPath
  added++
}

console.log('Querying pages…')
const pages = await client.fetch<PageRow[]>(`
  *[_type == "page" && defined(_oldPath)]{
    _oldPath,
    "slug": slug.current,
    "parentSlug": parent->slug.current,
    "grandParentSlug": parent->parent->slug.current,
    "greatGrandParentSlug": parent->parent->parent->slug.current
  }
`)
for (const p of pages) {
  const newPath = buildPagePath([p.greatGrandParentSlug, p.grandParentSlug, p.parentSlug, p.slug])
  add(p._oldPath, newPath)
}
console.log(`  ${pages.length} pages → ${added} redirects so far`)

const beforePosts = added
console.log('Querying posts…')
const posts = await client.fetch<PostRow[]>(`
  *[_type == "post" && defined(_oldPath)]{
    _oldPath,
    "slug": slug.current
  }
`)
for (const p of posts) {
  add(p._oldPath, `/novice/${p.slug}`)
}
console.log(`  ${posts.length} posts → ${added - beforePosts} new redirects`)

const beforeItems = added
console.log('Querying archive items…')
const items = await client.fetch<ArchiveItemRow[]>(`
  *[_type == "archiveItem" && defined(_oldPath)]{
    _oldPath,
    "slug": slug.current,
    "collectionSlug": collection->slug.current
  }
`)
for (const item of items) {
  add(item._oldPath, `/digiteka/${item.collectionSlug}/${item.slug}`)
}
console.log(`  ${items.length} archive items → ${added - beforeItems} new redirects`)

const beforeCollections = added
console.log('Querying collections…')
const collections = await client.fetch<CollectionRow[]>(`
  *[_type == "collection" && defined(_oldPath)]{
    _oldPath,
    "slug": slug.current
  }
`)
for (const c of collections) {
  add(c._oldPath, `/digiteka/${c.slug}`)
}
console.log(`  ${collections.length} collections → ${added - beforeCollections} new redirects`)

const outPath = join(ROOT, 'app/data/redirects.json')
writeFileSync(outPath, JSON.stringify(redirects, null, 2) + '\n')
console.log(`\nWrote ${added} redirects → ${outPath}`)
