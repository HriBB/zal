import { Link, useLoaderData } from 'react-router'

import type { Route } from './+types/novice'

import { loadSanity } from '~/sanity/data.server'
import { categoriesQuery, postListQuery } from '~/sanity/queries'

const PAGE_SIZE = 12

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const cat = url.searchParams.get('kat') ?? ''
  const stran = Math.max(1, parseInt(url.searchParams.get('stran') ?? '1', 10))
  const offset = (stran - 1) * PAGE_SIZE
  const lastIndex = offset + PAGE_SIZE - 1

  const [listData, catsData] = await Promise.all([
    loadSanity(request, postListQuery, { params: { cat, offset, lastIndex } }),
    loadSanity(request, categoriesQuery),
  ])

  return { listData, catsData, cat, stran }
}

export function meta() {
  return [{ title: 'Novice — ZAL' }]
}

export default function NoviceRoute() {
  const { listData, catsData, cat, stran } = useLoaderData<typeof loader>()
  const { posts, total } = listData.initial.data ?? { posts: [], total: 0 }
  const categories = catsData.initial.data ?? []
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-[var(--color-zal)]">Novice</h1>

      {/* Category filter chips */}
      <nav aria-label="Filtri kategorij" className="mb-8 flex flex-wrap gap-2">
        <Link
          to="/novice"
          className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
            cat === ''
              ? 'bg-[var(--color-zal)] text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          Vse
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            to={`/novice?kat=${c.slug}`}
            className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
              cat === c.slug
                ? 'bg-[var(--color-zal)] text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {c.title}
          </Link>
        ))}
      </nav>

      {/* Post grid */}
      {posts.length === 0 ? (
        <p className="text-stone-500">Ni objav.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Seznam novic">
          {posts.map((post) => (
            <li key={post._id} className="flex flex-col">
              <Link
                to={`/novice/${post.slug}`}
                className="group flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                {post.mainImage?.asset?.url && (
                  <img
                    src={post.mainImage.asset.url}
                    alt={post.mainImage.alt}
                    className="h-40 w-full rounded object-cover"
                    loading="lazy"
                  />
                )}
                <time
                  dateTime={post.date}
                  className="text-xs text-stone-400"
                >
                  {formatDate(post.date)}
                </time>
                <h2 className="text-base font-semibold text-stone-800 group-hover:text-[var(--color-zal)]">
                  {post.title}
                </h2>
                {post.categories.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1">
                    {post.categories.map((c) => (
                      <span
                        key={c._id}
                        className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
                      >
                        {c.title}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Paginacija" className="mt-10 flex items-center justify-center gap-2">
          {stran > 1 && (
            <Link
              to={paginationHref(cat, stran - 1)}
              className="rounded px-3 py-1 text-sm text-[var(--color-zal)] hover:underline"
            >
              ← Nazaj
            </Link>
          )}
          <span className="text-sm text-stone-500">
            Stran {stran} / {totalPages}
          </span>
          {stran < totalPages && (
            <Link
              to={paginationHref(cat, stran + 1)}
              className="rounded px-3 py-1 text-sm text-[var(--color-zal)] hover:underline"
            >
              Naprej →
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sl-SI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function paginationHref(cat: string, page: number): string {
  const params = new URLSearchParams()
  if (cat) params.set('kat', cat)
  if (page > 1) params.set('stran', String(page))
  const qs = params.toString()
  return `/novice${qs ? `?${qs}` : ''}`
}
