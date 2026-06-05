import { Link, useLoaderData } from 'react-router'

import type { Route } from './+types/enote.$slug'

import { sanityImageUrl } from '~/lib/image-url'
import { buildMeta } from '~/lib/meta'
import { loadSanity } from '~/sanity/data.server'
import { archiveUnitQuery } from '~/sanity/queries'

export async function loader({ params, request }: Route.LoaderArgs) {
  const data = await loadSanity(request, archiveUnitQuery, {
    params: { slug: params.slug ?? '' },
    notFoundIfEmpty: true,
  })
  return data
}

export function meta({ data, location }: Route.MetaArgs) {
  const unit = data?.initial?.data
  if (!unit) return [{ title: 'ZAL' }]
  return buildMeta({
    title: unit.name,
    description: `${unit.name}, območna enota Zgodovinskega arhiva Ljubljana.`,
    pathname: location.pathname,
    ogImageUrl: unit.photo?.asset?.url ?? null,
  })
}

export default function EnoteDetailRoute() {
  const data = useLoaderData<typeof loader>()
  const unit = data.initial.data!

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Navigacijska pot" className="mb-6">
        <ol className="flex items-center gap-1 text-sm text-stone-500">
          <li>
            <Link to="/enote" className="hover:text-[var(--color-zal)]">
              Enote
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">›</li>
          <li aria-current="page" className="text-stone-700">{unit.name}</li>
        </ol>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-[var(--color-zal)]">{unit.name}</h1>

      {/* Photo */}
      {unit.photo?.asset?.url && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={sanityImageUrl(unit.photo.asset.url, { w: 900, auto: 'format', q: 80 }) ?? unit.photo.asset.url}
            alt={unit.photo.alt ?? unit.name}
            className="h-64 w-full object-cover"
            fetchPriority="high"
          />
        </div>
      )}

      {/* Description */}
      {unit.description && (
        <p className="mb-8 text-stone-700">{unit.description}</p>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact */}
        <section aria-label="Kontakti">
          <h2 className="mb-4 text-lg font-semibold text-stone-800">Kontakti</h2>
          <address className="not-italic">
            <p className="whitespace-pre-line text-sm text-stone-600">{unit.address}</p>
            {unit.phones.length > 0 && (
              <ul className="mt-3 space-y-1">
                {unit.phones.map((p) => (
                  <li key={p._key} className="text-sm text-stone-600">
                    {p.label ? (
                      <span className="font-medium">{p.label}: </span>
                    ) : null}
                    <a
                      href={`tel:${p.number.replace(/\s/g, '')}`}
                      className="hover:text-[var(--color-zal)]"
                    >
                      {p.number}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {unit.emails.length > 0 && (
              <ul className="mt-2 space-y-1">
                {unit.emails.map((email) => (
                  <li key={email} className="text-sm">
                    <a
                      href={`mailto:${email}`}
                      className="text-stone-600 hover:text-[var(--color-zal)]"
                    >
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </address>
        </section>

        {/* Hours */}
        <section aria-label="Delovni čas">
          <h2 className="mb-4 text-lg font-semibold text-stone-800">Delovni čas</h2>
          {unit.officeHours.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-1 text-sm font-medium text-stone-500">Uradne ure</h3>
              <ul className="space-y-0.5">
                {unit.officeHours.map((s) => (
                  <li key={s._key} className="text-sm text-stone-600">
                    <span className="font-medium">{s.days}:</span> {s.hours}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {unit.readingRoomHours.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-stone-500">Čitalnica</h3>
              <ul className="space-y-0.5">
                {unit.readingRoomHours.map((s) => (
                  <li key={s._key} className="text-sm text-stone-600">
                    <span className="font-medium">{s.days}:</span> {s.hours}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Map */}
      {unit.mapUrl && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-stone-800">Kako do nas</h2>
          <div className="overflow-hidden rounded-lg" style={{ paddingTop: '56.25%', position: 'relative' }}>
            <iframe
              src={unit.mapUrl}
              title={`Karta: ${unit.name}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </article>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = error instanceof Response && error.status === 404
  return (
    <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="mb-4 text-6xl font-bold text-[var(--color-zal)]">
        {is404 ? '404' : 'Napaka'}
      </h1>
      <p className="text-lg text-stone-600">
        {is404 ? 'Enote ni mogoče najti.' : 'Prišlo je do nepričakovane napake.'}
      </p>
    </div>
  )
}
