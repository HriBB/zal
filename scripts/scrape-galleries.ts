/**
 * Recover NextGEN gallery scans + the breadcrumb-derived collection map that the WP
 * REST dump cannot give us (ADR 0002, issue #3).
 *
 * Run: pnpm scrape   (node --experimental-strip-types scripts/scrape-galleries.ts)
 *
 * The REST dump renders every Digiteka item's gallery as an `ngg_shortcode`
 * placeholder, so this fetches each live `/project/` page (plus the two ngg-bearing
 * pages, galerija + filmoteka), extracts the FULL-RESOLUTION originals (the <a> href
 * targets under /wp-content/blogs.dir/<id>/files/, never the thumbs_ variants),
 * downloads them, and records each slug's ordered gallery + its collection chain.
 *
 * Outputs (DATA — written OUTSIDE this repo, under the shared download folder):
 *   download/galleries.json        slug → { url, status, collection, breadcrumb,
 *                                   item, scans:[{sourceUrl, localPath}] }
 *   download/scrape-failures.json  [{ slug, url, error }] — like failed-downloads.json
 *   download/scans/<slug>/<file>   the downloaded full-resolution scans
 *
 * Idempotent + resumable: a slug already recorded `ok` is skipped, and a scan already
 * on disk (non-zero size) is not re-fetched. Throttled with a politeness delay against
 * the live site. Host is normalised (zal-lj.splet.arnes.si → www.zal-lj.si) everywhere.
 *
 * Env knobs (all optional): SCRAPE_SLUGS=a,b — only these slugs; SCRAPE_LIMIT=n — first
 * n targets; SCRAPE_DELAY=ms — politeness delay (default 400); SCRAPE_DOWNLOAD=0 — index
 * only, skip binary downloads; SCRAPE_FORCE=1 — re-scrape slugs already recorded ok.
 *
 * Pure URL/breadcrumb logic lives in app/lib/scrape-gallery.ts (unit-tested); this file
 * owns only the fetch/throttle/download/disk side effects. Imported with an explicit
 * `.ts` path so it runs under `node --experimental-strip-types`.
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type { Collection, Crumb } from '../app/lib/scrape-gallery.ts'

import {
  breadcrumbToCollection,
  extractBreadcrumb,
  extractGalleryUrls,
  normalizeHost,
  scanLocalPath,
} from '../app/lib/scrape-gallery.ts'

const DOWNLOAD = new URL('../../download/', import.meta.url).pathname
const CONTENT = join(DOWNLOAD, 'content')
const GALLERIES_JSON = join(DOWNLOAD, 'galleries.json')
const FAILURES_JSON = join(DOWNLOAD, 'scrape-failures.json')

const DELAY = Number(process.env.SCRAPE_DELAY ?? 400)
const LIMIT = process.env.SCRAPE_LIMIT ? Number(process.env.SCRAPE_LIMIT) : Infinity
const ONLY = process.env.SCRAPE_SLUGS?.split(',').map((s) => s.trim()).filter(Boolean)
const DO_DOWNLOAD = process.env.SCRAPE_DOWNLOAD !== '0'
const FORCE = process.env.SCRAPE_FORCE === '1'

/** A page to scrape: a Digiteka project or one of the two ngg-bearing pages. */
type Target = { slug: string; url: string; type: 'project' | 'page' }

/** The recorded result for one slug in galleries.json. */
type Entry = {
  type: 'project' | 'page'
  url: string
  status: 'ok' | 'failed'
  collection: Collection | null
  breadcrumb: string[]
  item: string | null
  scans: { sourceUrl: string; localPath: string }[]
  scrapedAt: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).size > 0
  } catch {
    return false
  }
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i >= attempts) throw err
      const delay = 500 * 2 ** (i - 1)
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  ⚠ ${label}: ${msg} — retry ${i}/${attempts - 1} in ${delay}ms`)
      await sleep(delay)
    }
  }
}

async function fetchText(url: string): Promise<string> {
  return withRetry(url, async () => {
    const r = await fetch(url, { headers: { 'user-agent': 'zal-migration-scrape' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.text()
  })
}

/** Download one scan to disk, skipping if already present. Returns 'ok' | 'skip'. */
async function downloadScan(url: string, dest: string): Promise<'ok' | 'skip'> {
  if (await exists(dest)) return 'skip'
  await mkdir(dirname(dest), { recursive: true })
  const buf = await withRetry(url, async () => {
    const r = await fetch(url, { headers: { 'user-agent': 'zal-migration-scrape' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return Buffer.from(await r.arrayBuffer())
  })
  await writeFile(dest, buf)
  return 'ok'
}

/** Build the ordered scrape work list: ngg projects first, then the two ngg pages. */
async function buildTargets(): Promise<Target[]> {
  const projects = await readJson<{ slug: string; link: string; content?: { rendered?: string } }[]>(
    join(CONTENT, 'projects.json'),
    [],
  )
  const targets: Target[] = projects
    .filter((p) => /ngg_shortcode|ngg-galleryoverview/i.test(p.content?.rendered ?? ''))
    .map((p) => ({ slug: p.slug, url: normalizeHost(p.link), type: 'project' as const }))

  // The two ngg-bearing pages (CONTEXT.md / issue #3). filmoteka is not in the pages
  // REST dump, so both live URLs are pinned from the sitemap.
  targets.push(
    { slug: 'galerija', url: 'https://www.zal-lj.si/domaca-stran-1/galerija/', type: 'page' },
    { slug: 'filmoteka', url: 'https://www.zal-lj.si/filmoteka-zal/', type: 'page' },
  )

  let list = targets
  if (ONLY) list = list.filter((t) => ONLY.includes(t.slug))
  return list.slice(0, LIMIT)
}

async function main() {
  const galleries = await readJson<Record<string, Entry>>(GALLERIES_JSON, {})
  const failures: { slug: string; url: string; error: string }[] = []
  const targets = await buildTargets()
  console.log(
    `${targets.length} targets (download=${DO_DOWNLOAD ? 'on' : 'off'}, force=${FORCE}, delay=${DELAY}ms)`,
  )

  let done = 0
  for (const target of targets) {
    done++
    const existing = galleries[target.slug]
    if (existing?.status === 'ok' && !FORCE) {
      console.log(`  [${done}/${targets.length}] ${target.slug} — skip (already ok)`)
      continue
    }

    try {
      const html = await fetchText(target.url)
      const crumbs: Crumb[] = extractBreadcrumb(html)
      const collection = target.type === 'project' ? breadcrumbToCollection(crumbs) : null
      const item = crumbs.length ? (crumbs[crumbs.length - 1]?.text ?? null) : null
      const urls = extractGalleryUrls(html)

      const scans = urls.map((sourceUrl) => ({
        sourceUrl,
        localPath: scanLocalPath(target.slug, sourceUrl),
      }))

      if (DO_DOWNLOAD) {
        for (const scan of scans) {
          try {
            await downloadScan(scan.sourceUrl, join(DOWNLOAD, scan.localPath))
          } catch (err) {
            failures.push({
              slug: target.slug,
              url: scan.sourceUrl,
              error: err instanceof Error ? err.message : String(err),
            })
          }
        }
      }

      galleries[target.slug] = {
        type: target.type,
        url: target.url,
        status: 'ok',
        collection,
        breadcrumb: crumbs.map((c) => c.text),
        item,
        scans,
        scrapedAt: new Date().toISOString(),
      }
      console.log(
        `  [${done}/${targets.length}] ${target.slug} — ${scans.length} scans` +
          (collection ? ` · ${collection.slug}` : ''),
      )
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      failures.push({ slug: target.slug, url: target.url, error })
      galleries[target.slug] = {
        type: target.type,
        url: target.url,
        status: 'failed',
        collection: null,
        breadcrumb: [],
        item: null,
        scans: [],
        scrapedAt: new Date().toISOString(),
      }
      console.warn(`  [${done}/${targets.length}] ${target.slug} — FAILED: ${error}`)
    }

    // Persist after every target so a crash leaves a resumable index.
    await mkdir(DOWNLOAD, { recursive: true })
    await writeFile(GALLERIES_JSON, JSON.stringify(galleries, null, 2))
    if (DELAY) await sleep(DELAY)
  }

  if (failures.length) {
    await writeFile(FAILURES_JSON, JSON.stringify(failures, null, 2))
    console.warn(`  ⚠ ${failures.length} failures → scrape-failures.json`)
  }

  const ok = Object.values(galleries).filter((e) => e.status === 'ok').length
  const scanCount = Object.values(galleries).reduce((n, e) => n + e.scans.length, 0)
  console.log(`Done. ${ok} entries ok, ${scanCount} scans indexed → galleries.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
