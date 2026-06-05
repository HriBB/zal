import { isRouteErrorResponse, useLoaderData } from 'react-router'

import type { Route } from './+types/page'

import { BlockList } from '~/components/blocks/BlockRenderer'
import { Breadcrumbs } from '~/components/Breadcrumbs'
import { matchesChain } from '~/lib/page-chain'
import { loadSanity } from '~/sanity/data.server'
import { pageQuery } from '~/sanity/queries'

export async function loader({ params, request }: Route.LoaderArgs) {
  const path = (params as Record<string, string>)['*'] ?? ''
  const segments = path.split('/').filter(Boolean)

  if (segments.length === 0) {
    throw new Response('Not Found', { status: 404 })
  }

  const slug = segments[segments.length - 1]!
  const data = await loadSanity(request, pageQuery, { params: { slug } })
  const page = data.initial.data

  if (!page || !matchesChain(page, segments)) {
    throw new Response('Not Found', { status: 404 })
  }

  return data
}

export function meta({ data }: Route.MetaArgs) {
  const page = data?.initial?.data
  return [{ title: page?.title ? `${page.title} — ZAL` : 'ZAL' }]
}

export default function PageRoute() {
  const data = useLoaderData<typeof loader>()
  const page = data.initial.data!

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      {page.breadcrumbs.length > 0 && (
        <div className="mb-6">
          <Breadcrumbs items={page.breadcrumbs} current={page.title} />
        </div>
      )}
      <h1 className="mb-8 text-3xl font-bold text-[var(--color-zal)]">
        {page.title}
      </h1>
      <BlockList blocks={page.blocks as Parameters<typeof BlockList>[0]['blocks']} />
    </article>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 =
    isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="mb-4 text-6xl font-bold text-[var(--color-zal)]">
        {is404 ? '404' : 'Napaka'}
      </h1>
      <p className="text-lg text-stone-600">
        {is404
          ? 'Strani ni mogoče najti.'
          : 'Prišlo je do nepričakovane napake.'}
      </p>
    </div>
  )
}
