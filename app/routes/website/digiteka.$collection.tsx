import { Link, useLoaderData, useSearchParams } from 'react-router'

import { loadSanity } from '~/sanity/data.server'
import { collectionQuery, archiveItemListQuery } from '~/sanity/queries'

import type { Route } from './+types/digiteka.$collection'

const PAGE_SIZE = 12

export async function loader({ request, params }: Route.LoaderArgs) {
  const { collection: slug } = params
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('stran') ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const collData = await loadSanity(request, collectionQuery, { params: { slug } })
  const collection = collData.initial.data
  if (!collection) throw new Response(null, { status: 404 })

  const listData = await loadSanity(request, archiveItemListQuery, {
    params: { collectionId: collection._id, offset, lastIndex: offset + PAGE_SIZE - 1 },
  })
  const total = listData.initial.data?.total ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)

  return { collData, listData, page, pageCount }
}

export function meta({ data }: Route.MetaArgs) {
  const name = data?.collData?.initial?.data?.name ?? 'Zbirka'
  return [
    { title: `${name} – Digiteka – ZAL` },
    { name: 'description', content: `Arhivalije v zbirki ${name}` },
  ]
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
      <p className="text-xl font-semibold text-stone-700">Zbirka ni bila najdena.</p>
      <Link to="/digiteka" className="mt-4 inline-block text-[#8b1d1c] hover:underline">
        ← Vse zbirke
      </Link>
    </div>
  )
}

export default function CollectionPage() {
  const { collData, listData, page, pageCount } = useLoaderData<typeof loader>()
  const collection = collData.initial.data!
  const listResult = listData.initial.data
  const items = listResult?.items ?? []
  const total = listResult?.total ?? 0
  const [, setSearchParams] = useSearchParams()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone-500">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link to="/" className="hover:underline">
              Domov
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/digiteka" className="hover:underline">
              Digiteka
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page">{collection.name}</li>
        </ol>
      </nav>

      <h1 className="mb-2 text-3xl font-bold">{collection.name}</h1>
      {collection.description && (
        <p className="mb-4 text-stone-600">{collection.description}</p>
      )}
      {collection.externalUrl && (
        <a
          href={collection.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-block rounded bg-[#8b1d1c] px-4 py-2 text-sm font-medium text-white hover:bg-[#ba3741]"
        >
          Poglej na SIstory ↗
        </a>
      )}
      <p className="mb-6 text-sm text-stone-500">{total} arhivalij</p>

      {items.length > 0 ? (
        <ul className="divide-y divide-stone-100" aria-label="Arhivalije v zbirki">
          {items.map((item) => (
            <li key={item._id}>
              <Link
                to={`/digiteka/${collection.slug}/${item.slug}`}
                className="block py-3 hover:text-[#8b1d1c]"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-stone-500">V tej zbirki ni arhivalij.</p>
      )}

      {pageCount > 1 && (
        <nav aria-label="Paginacija" className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <button
              onClick={() => setSearchParams({ stran: String(page - 1) })}
              className="rounded border border-stone-200 px-3 py-1 text-sm hover:border-[#8b1d1c]"
            >
              ← Prejšnja
            </button>
          )}
          <span className="px-3 py-1 text-sm text-stone-500">
            {page} / {pageCount}
          </span>
          {page < pageCount && (
            <button
              onClick={() => setSearchParams({ stran: String(page + 1) })}
              className="rounded border border-stone-200 px-3 py-1 text-sm hover:border-[#8b1d1c]"
            >
              Naslednja →
            </button>
          )}
        </nav>
      )}
    </div>
  )
}
