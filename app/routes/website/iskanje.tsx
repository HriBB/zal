import { Link, useLoaderData } from 'react-router'

import type { Route } from './+types/iskanje'

import { loadSanity } from '~/sanity/data.server'
import { searchQuery } from '~/sanity/queries'
import type { SearchResults } from '~/sanity/queries'
import { sanitizeTerm, isValidTerm, totalHits } from '~/lib/search'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const raw = url.searchParams.get('q') ?? ''
  const term = sanitizeTerm(raw)
  const valid = isValidTerm(term)

  if (!valid) {
    return { term, valid, results: null }
  }

  const searchData = await loadSanity(request, searchQuery, {
    params: { term: term + '*' },
  })

  return { term, valid, results: searchData.initial.data }
}

export function meta({ data }: Route.MetaArgs) {
  const q = data?.term ? ` — ${data.term}` : ''
  return [{ title: `Iskanje${q} — ZAL` }]
}

export default function IskanjeRoute() {
  const { term, valid, results } = useLoaderData<typeof loader>()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-[var(--color-zal)]">Iskanje</h1>

      {/* SIRAnet pointer — always visible */}
      <SiranetBanner />

      {/* Search form */}
      <form method="get" action="/iskanje" className="mb-10 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder="Iskalni niz…"
          aria-label="Iskalni niz"
          className="flex-1 rounded border border-stone-300 px-4 py-2 text-sm focus:border-[var(--color-zal)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-[var(--color-zal)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-zal-light)]"
        >
          Išči
        </button>
      </form>

      {!valid && (
        <p className="text-stone-500" aria-label="Prazno iskanje">
          Vnesite iskalni niz (vsaj 2 znaka).
        </p>
      )}

      {valid && results !== null && totalHits(results) === 0 && (
        <p className="text-stone-500" aria-label="Ni zadetkov">
          Ni zadetkov za &ldquo;{term}&rdquo;.
        </p>
      )}

      {valid && results !== null && totalHits(results) > 0 && (
        <SearchResultGroups results={results} />
      )}
    </div>
  )
}

// ── SIRAnet banner ────────────────────────────────────────────────────────────

function SiranetBanner() {
  return (
    <aside
      aria-label="SIRAnet"
      className="mb-8 rounded border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-stone-700"
    >
      <p>
        <strong>Iščete arhivske fonde ali zbirke?</strong> Iskanje po inventarjih in fondih
        je dostopno v sistemu{' '}
        <a
          href="https://www.siranet.si/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--color-zal)] underline hover:text-[var(--color-zal-light)]"
        >
          SIRAnet
        </a>
        {' '}in virtualnem arhivskem centru{' '}
        <a
          href="https://www.vac.si/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--color-zal)] underline hover:text-[var(--color-zal-light)]"
        >
          VAC
        </a>
        .
      </p>
    </aside>
  )
}

// ── Result groups ─────────────────────────────────────────────────────────────

function SearchResultGroups({ results }: { results: SearchResults }) {
  return (
    <div className="space-y-10" aria-label="Rezultati iskanja">
      {results.pages.length > 0 && (
        <ResultGroup label="Strani" count={results.pages.length}>
          {results.pages.map((p) => (
            <ResultItem key={p._id} href={buildPageHref(p.slug)} title={p.title} />
          ))}
        </ResultGroup>
      )}
      {results.posts.length > 0 && (
        <ResultGroup label="Novice" count={results.posts.length}>
          {results.posts.map((p) => (
            <ResultItem key={p._id} href={`/novice/${p.slug}`} title={p.title} meta={formatDate(p.date)} />
          ))}
        </ResultGroup>
      )}
      {results.collections.length > 0 && (
        <ResultGroup label="Zbirke" count={results.collections.length}>
          {results.collections.map((c) => (
            <ResultItem key={c._id} href={`/digiteka/${c.slug}`} title={c.name} />
          ))}
        </ResultGroup>
      )}
      {results.archiveItems.length > 0 && (
        <ResultGroup label="Arhivalije" count={results.archiveItems.length}>
          {results.archiveItems.map((a) => (
            <ResultItem
              key={a._id}
              href={`/digiteka/${a.collectionSlug}/${a.slug}`}
              title={a.title}
            />
          ))}
        </ResultGroup>
      )}
    </div>
  )
}

function ResultGroup({
  label,
  count,
  children,
}: {
  label: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section aria-label={label}>
      <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold text-stone-700">
        {label}
        <span className="text-sm font-normal text-stone-400">({count})</span>
      </h2>
      <ul className="divide-y divide-stone-100 rounded border border-stone-200 bg-white">
        {children}
      </ul>
    </section>
  )
}

function ResultItem({
  href,
  title,
  meta,
}: {
  href: string
  title: string
  meta?: string
}) {
  return (
    <li>
      <Link
        to={href}
        className="flex flex-col gap-0.5 px-4 py-3 hover:bg-stone-50"
      >
        <span className="text-sm font-medium text-[var(--color-zal)] hover:underline">{title}</span>
        {meta && <span className="text-xs text-stone-400">{meta}</span>}
        <span className="text-xs text-stone-300">{href}</span>
      </Link>
    </li>
  )
}

function buildPageHref(slug: string): string {
  return `/${slug}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sl-SI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
