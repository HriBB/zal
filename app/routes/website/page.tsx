import { isRouteErrorResponse, redirect, useLoaderData } from 'react-router'

import type { Route } from './+types/page'

import { BlockList } from '~/components/blocks/BlockRenderer'
import { Breadcrumbs } from '~/components/Breadcrumbs'
import redirectMap from '~/data/redirects.json'
import { normalizeOldPath } from '~/lib/redirects'
import { matchesChain } from '~/lib/page-chain'
import { buildMeta, ZAL_ORIGIN } from '~/lib/meta'
import { buildBreadcrumbJsonLd } from '~/lib/jsonld'
import { loadSanity } from '~/sanity/data.server'
import { pageQuery, type BreadcrumbItem } from '~/sanity/queries'

export async function loader({ params, request }: Route.LoaderArgs) {
  const path = (params as Record<string, string>)['*'] ?? ''
  const segments = path.split('/').filter(Boolean)

  if (segments.length === 0) {
    throw new Response('Not Found', { status: 404 })
  }

  // Check redirect map before attempting page lookup (ADR-0003).
  const oldPath = normalizeOldPath(`/${path}`)
  const newPath = (redirectMap as Record<string, string>)[oldPath]
  if (newPath) {
    return redirect(newPath, 301)
  }

  const slug = segments[segments.length - 1]!
  const data = await loadSanity(request, pageQuery, { params: { slug } })
  const page = data.initial.data

  if (!page || !matchesChain(page, segments)) {
    throw new Response('Not Found', { status: 404 })
  }

  return data
}

export function meta({ data, location }: Route.MetaArgs) {
  const page = data?.initial?.data
  if (!page) return [{ title: 'ZAL' }]

  const baseMeta = buildMeta({
    title: page.title,
    description: `${page.title} na spletni strani Zgodovinskega arhiva Ljubljana.`,
    pathname: location.pathname,
  })

  if (page.breadcrumbs.length === 0) return baseMeta

  const breadcrumbItems = buildPageBreadcrumbItems(page.breadcrumbs, page.title, page.slug)
  return [...baseMeta, { 'script:ld+json': buildBreadcrumbJsonLd(breadcrumbItems) }]
}

function buildPageBreadcrumbItems(
  breadcrumbs: BreadcrumbItem[],
  currentTitle: string,
  currentSlug: string,
) {
  const ancestors = breadcrumbs.map((b, i) => ({
    name: b.title,
    url: `${ZAL_ORIGIN}/${breadcrumbs.slice(0, i + 1).map((x) => x.slug).join('/')}`,
  }))
  return [
    { name: 'Domov', url: `${ZAL_ORIGIN}/` },
    ...ancestors,
    { name: currentTitle, url: `${ZAL_ORIGIN}/${[...breadcrumbs.map((b) => b.slug), currentSlug].join('/')}` },
  ]
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
