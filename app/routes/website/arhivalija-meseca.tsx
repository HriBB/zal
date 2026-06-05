import { Link, useLoaderData } from 'react-router'

import type { Route } from './+types/arhivalija-meseca'

import { buildMeta } from '~/lib/meta'
import { loadSanity } from '~/sanity/data.server'
import { arhivaListQuery } from '~/sanity/queries'

export async function loader({ request }: Route.LoaderArgs) {
  return loadSanity(request, arhivaListQuery)
}

export function meta({ location }: Route.MetaArgs) {
  return buildMeta({
    title: 'Arhivalija meseca',
    description: 'Mesečna predstavitev arhivskega gradiva Zgodovinskega arhiva Ljubljana.',
    pathname: location.pathname,
  })
}

export default function ArhivalijaRoute() {
  const data = useLoaderData<typeof loader>()
  const posts = data.initial.data ?? []

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-[var(--color-zal)]">Arhivalija meseca</h1>

      {posts.length === 0 ? (
        <p className="text-stone-500">Ni objav.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-200" aria-label="Arhivalija meseca">
          {posts.map((post) => (
            <li key={post._id} className="flex items-start gap-4 py-5">
              {post.mainImage?.asset?.url && (
                <img
                  src={post.mainImage.asset.url}
                  alt={post.mainImage.alt}
                  className="h-20 w-20 flex-shrink-0 rounded object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex flex-col gap-1">
                <time dateTime={post.date} className="text-xs text-stone-400">
                  {formatDate(post.date)}
                </time>
                <Link
                  to={`/novice/${post.slug}`}
                  className="font-medium text-stone-800 hover:text-[var(--color-zal)]"
                >
                  {post.title}
                </Link>
              </div>
            </li>
          ))}
        </ul>
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
