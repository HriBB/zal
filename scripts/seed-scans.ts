/**
 * Upload scan images for Digiteka archive items and patch their gallery field.
 *
 * Run: node --experimental-strip-types scripts/seed-scans.ts
 * Flags:
 *   SEED_DRY=1            print actions without writing to Sanity or disk
 *   SEED_SLUGS=slug1,...  process only these slugs (comma-separated)
 *
 * Idempotency:
 *   - gallery-asset-memo.json (localPath → Sanity assetId) persisted after every item
 *   - re-run uploads nothing already uploaded; patch is always set to full gallery
 *
 * Retry: each upload retried up to 3× with exponential backoff (500ms base).
 */

import 'dotenv/config'
import { basename, dirname, join } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createClient } from '@sanity/client'

import { withRetry } from '../app/lib/upload-retry.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DOWNLOAD_ROOT = join(ROOT, '../download')

// ── Sanity client ────────────────────────────────────────────────────────────

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const dry = process.env.SEED_DRY === '1'
const onlySlugs = process.env.SEED_SLUGS
  ? new Set(process.env.SEED_SLUGS.split(',').map((s) => s.trim()))
  : null

if (!projectId) throw new Error('SANITY_PROJECT_ID not set')
if (!token && !dry) throw new Error('SANITY_WRITE_TOKEN not set')

const client = createClient({ projectId, dataset, token: token ?? '', apiVersion, useCdn: false })

// ── Load galleries.json ───────────────────────────────────────────────────────

type GalleryScan = { sourceUrl: string; localPath: string }
type GalleryEntry = {
  type: 'project' | 'page'
  item?: string
  scans: GalleryScan[]
}
type GalleriesData = Record<string, GalleryEntry>

const GALLERIES_JSON = join(DOWNLOAD_ROOT, 'galleries.json')
if (!existsSync(GALLERIES_JSON)) {
  console.error('galleries.json not found — run pnpm scrape first')
  process.exit(1)
}

const galleries: GalleriesData = JSON.parse(readFileSync(GALLERIES_JSON, 'utf-8'))
const allSlugs = Object.keys(galleries)
console.log(`Loaded ${allSlugs.length} entries from galleries.json`)

// ── Load asset memo ───────────────────────────────────────────────────────────
// localPath → Sanity assetId; persisted across runs

const MEMO_JSON = join(DOWNLOAD_ROOT, 'gallery-asset-memo.json')
const memo: Map<string, string> = new Map(
  existsSync(MEMO_JSON)
    ? Object.entries(JSON.parse(readFileSync(MEMO_JSON, 'utf-8')) as Record<string, string>)
    : [],
)

function saveMemo() {
  if (dry) return
  writeFileSync(MEMO_JSON, JSON.stringify(Object.fromEntries(memo), null, 2))
}

// ── Upload a single scan from disk ───────────────────────────────────────────

// Sanity asset `label` rejects empty strings and very long values ("Validation
// failed"). Trim, truncate, and omit entirely when empty.
function safeLabel(alt: string | undefined): string | undefined {
  const trimmed = alt?.trim()
  return trimmed ? trimmed.slice(0, 200) : undefined
}

async function uploadScan(localPath: string, alt: string): Promise<string | null> {
  if (dry) return `dry-asset-${localPath}`

  const cached = memo.get(localPath)
  if (cached) return cached

  const absPath = join(DOWNLOAD_ROOT, localPath)
  if (!existsSync(absPath)) {
    console.warn(`  [upload] file not found: ${localPath}`)
    return null
  }

  try {
    const assetId = await withRetry(
      async () => {
        const buffer = readFileSync(absPath)
        const filename = basename(localPath)
        const asset = await client.assets.upload('image', buffer, { filename, label: safeLabel(alt) })
        return asset._id
      },
      { maxAttempts: 3, baseDelayMs: 500 },
    )
    memo.set(localPath, assetId)
    return assetId
  } catch (err) {
    console.warn(`  [upload] failed ${localPath}: ${(err as Error).message}`)
    return null
  }
}

// ── Build a gallery figure doc ────────────────────────────────────────────────

function makeKey(i: number) {
  return `scan-${String(i).padStart(4, '0')}`
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  // Only process archiveItem slugs (type === 'project'), with scans
  const targets = allSlugs
    .filter((slug) => {
      const entry = galleries[slug]
      return entry.type === 'project' && entry.scans.length > 0
    })
    .filter((slug) => !onlySlugs || onlySlugs.has(slug))

  console.log(`\nProcessing ${targets.length} archive item(s) with scans…`)

  let itemsPatched = 0
  let itemsSkipped = 0
  let totalUploads = 0
  let totalFailed = 0

  for (const slug of targets) {
    const entry = galleries[slug]
    const itemTitle = entry.item ?? slug
    const docId = `archiveItem.${slug}`

    console.log(`\n${slug} (${entry.scans.length} scans)`)

    const figures: Record<string, unknown>[] = []
    let failed = 0

    for (let i = 0; i < entry.scans.length; i++) {
      const scan = entry.scans[i]
      const alt = `${itemTitle} – posnetek ${i + 1}`
      const assetId = await uploadScan(scan.localPath, alt)

      if (assetId) {
        figures.push({
          _type: 'figure',
          _key: makeKey(i),
          asset: { _type: 'reference', _ref: assetId },
          alt,
        })
        if (!dry && !memo.has(scan.localPath)) {
          // already set in uploadScan; saveMemo periodically
        }
      } else {
        failed++
        totalFailed++
      }
    }

    // Persist memo after each item so partial runs are resumable
    saveMemo()

    if (figures.length === 0) {
      console.warn(`  [skip] no figures resolved for ${slug}`)
      itemsSkipped++
      continue
    }

    totalUploads += figures.length

    if (dry) {
      console.log(`  [dry] would patch ${docId} with ${figures.length} figures`)
      itemsPatched++
      continue
    }

    try {
      await withRetry(
        () =>
          client
            .patch(docId)
            .set({ gallery: figures })
            .commit(),
        { maxAttempts: 3, baseDelayMs: 500 },
      )
      console.log(`  ✓ patched ${docId} — ${figures.length} figures${failed ? ` (${failed} failed)` : ''}`)
      itemsPatched++
    } catch (err) {
      console.error(`  ✗ patch failed ${docId}: ${(err as Error).message}`)
      itemsSkipped++
    }
  }

  console.log(`
Done.
  Items patched: ${itemsPatched}
  Items skipped: ${itemsSkipped}
  Figures uploaded/cached: ${totalUploads}
  Upload failures: ${totalFailed}
`)
}

run().catch((err) => {
  console.error('[seed-scans] fatal:', err)
  process.exit(1)
})
