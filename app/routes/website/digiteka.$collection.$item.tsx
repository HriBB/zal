import { Link, useLoaderData } from 'react-router'

import { loadSanity } from '~/sanity/data.server'
import { archiveItemQuery } from '~/sanity/queries'

import type { Route } from './+types/digiteka.$collection.$item'

export async function loader({ request, params }: Route.LoaderArgs) {
  const { collection: collectionSlug, item: slug } = params
  const data = await loadSanity(request, archiveItemQuery, {
    params: { slug, collectionSlug },
  })
  if (!data.initial.data) throw new Response(null, { status: 404 })
  return data
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.initial?.data?.title ?? 'Arhivalija'
  return [
    { title: `${title} – Digiteka – ZAL` },
    { name: 'description', content: `Arhivalija: ${title}` },
  ]
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
      <p className="text-xl font-semibold text-stone-700">Arhivalija ni bila najdena.</p>
      <Link to="/digiteka" className="mt-4 inline-block text-[#8b1d1c] hover:underline">
        ← Digiteka
      </Link>
    </div>
  )
}

export default function ArchiveItemPage() {
  const data = useLoaderData<typeof loader>()
  const item = data.initial.data!

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
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
          <li>
            <Link to={`/digiteka/${item.collectionSlug}`} className="hover:underline">
              {item.collectionName}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page">{item.title}</li>
        </ol>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">{item.title}</h1>

      {item.externalUrl && (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-block rounded bg-[#8b1d1c] px-4 py-2 text-sm font-medium text-white hover:bg-[#ba3741]"
        >
          Poglej na SIstory ↗
        </a>
      )}

      {item.metadata.length > 0 && (
        <section aria-label="Metapodatki" className="mb-8">
          <dl className="divide-y divide-stone-100">
            {item.metadata.map((entry) => (
              <div key={entry._key} className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-4 py-2">
                <dt className="font-medium text-stone-700">{entry.label}</dt>
                <dd className="text-stone-600">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {item.gallery.length > 0 && (
        <section aria-label="Posnetki" className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Posnetki</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {item.gallery.map((fig) =>
              fig.asset ? (
                <li key={fig._key}>
                  <img
                    src={fig.asset.url}
                    alt={fig.alt ?? item.title}
                    className="w-full rounded object-cover"
                    loading="lazy"
                  />
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}
    </div>
  )
}
