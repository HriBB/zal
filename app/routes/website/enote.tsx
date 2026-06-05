import { Link, useLoaderData } from 'react-router'

import type { Route } from './+types/enote'

import { sanityImageUrl } from '~/lib/image-url'
import { buildMeta } from '~/lib/meta'
import { loadSanity } from '~/sanity/data.server'
import { archiveUnitsQuery } from '~/sanity/queries'

const ENOTE_DESCRIPTION =
  'Pet območnih enot Zgodovinskega arhiva Ljubljana: Ljubljana, Kranj, ' +
  'Novo mesto, Škofja Loka in Idrija.'

export async function loader({ request }: Route.LoaderArgs) {
  return loadSanity(request, archiveUnitsQuery)
}

export function meta({ location }: Route.MetaArgs) {
  return buildMeta({
    title: 'Enote',
    description: ENOTE_DESCRIPTION,
    pathname: location.pathname,
  })
}

export default function EnoteIndexRoute() {
  const data = useLoaderData<typeof loader>()
  const units = data.initial.data ?? []

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-[var(--color-zal)]">Enote</h1>
      <p className="mb-10 text-stone-600">{ENOTE_DESCRIPTION}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        {units.map((unit) => (
          <Link
            key={unit._id}
            to={`/enote/${unit.slug}`}
            className="group overflow-hidden rounded-lg border border-stone-200 hover:border-[var(--color-zal)] hover:shadow-md transition-shadow"
          >
            {unit.photo?.asset?.url && (
              <img
                src={sanityImageUrl(unit.photo.asset.url, { w: 800, auto: 'format', q: 75 }) ?? unit.photo.asset.url}
                alt={unit.photo.alt ?? unit.name}
                className="h-44 w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="p-5">
              <h2 className="font-semibold group-hover:text-[var(--color-zal)] transition-colors">
                {unit.name}
              </h2>
              {unit.address && (
                <p className="mt-1 whitespace-pre-line text-sm text-stone-500">{unit.address}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
