import { Link, useLoaderData } from 'react-router'

import { buildMeta } from '~/lib/meta'
import { loadSanity } from '~/sanity/data.server'
import { collectionsQuery } from '~/sanity/queries'

import type { Route } from './+types/digiteka'

export async function loader({ request }: Route.LoaderArgs) {
  return loadSanity(request, collectionsQuery)
}

export function meta({ location }: Route.MetaArgs) {
  return buildMeta({
    title: 'Digiteka',
    description: 'Digitalizirano arhivsko gradivo Zgodovinskega arhiva Ljubljana.',
    pathname: location.pathname,
  })
}

export default function DigitekaPage() {
  const data = useLoaderData<typeof loader>()
  const collections = data.initial.data

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone-500">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:underline">
              Domov
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page">Digiteka</li>
        </ol>
      </nav>
      <h1 className="mb-2 text-3xl font-bold">Digiteka</h1>
      <p className="mb-8 text-stone-600">Digitalizirano arhivsko gradivo Zgodovinskega arhiva Ljubljana.</p>
      {collections && collections.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2" aria-label="Zbirke">
          {collections.map((coll) => (
            <li key={coll._id}>
              <Link
                to={`/digiteka/${coll.slug}`}
                className="block rounded border border-stone-200 bg-white p-5 hover:border-[#8b1d1c] hover:shadow-sm"
              >
                <h2 className="font-semibold text-[#8b1d1c]">{coll.name}</h2>
                {coll.description && (
                  <p className="mt-1 text-sm text-stone-600 line-clamp-2">{coll.description}</p>
                )}
                <p className="mt-2 text-xs text-stone-400">{coll.itemCount} arhivalij</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-stone-500">Zbirke še niso na voljo.</p>
      )}
    </div>
  )
}
