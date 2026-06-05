import { Link, useLoaderData } from 'react-router'

import type { Route } from './+types/novice.$slug'

import { BlockList } from '~/components/blocks/BlockRenderer'
import { buildMeta, ZAL_ORIGIN } from '~/lib/meta'
import { buildNewsArticleJsonLd } from '~/lib/jsonld'
import { loadSanity } from '~/sanity/data.server'
import { postQuery } from '~/sanity/queries'

export async function loader({ params, request }: Route.LoaderArgs) {
  const data = await loadSanity(request, postQuery, { params: { slug: params.slug ?? '' } })
  if (!data.initial.data) {
    throw new Response('Not Found', { status: 404 })
  }
  return data
}

export function meta({ data, location }: Route.MetaArgs) {
  const post = data?.initial?.data
  if (!post) return [{ title: 'ZAL' }]

  const ogImageUrl = post.mainImage?.asset?.url ?? null
  const canonical = `${ZAL_ORIGIN}${location.pathname}`

  return [
    ...buildMeta({
      title: post.title,
      description: post.title,
      pathname: location.pathname,
      ogImageUrl,
      ogType: 'article',
    }),
    {
      'script:ld+json': buildNewsArticleJsonLd({
        title: post.title,
        url: canonical,
        datePublished: post.date,
        imageUrl: ogImageUrl,
      }),
    },
  ]
}

export default function NoviceDetailRoute() {
  const data = useLoaderData<typeof loader>()
  const post = data.initial.data!

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Navigacijska pot" className="mb-6">
        <ol className="flex items-center gap-1 text-sm text-stone-500">
          <li>
            <Link to="/novice" className="hover:text-[var(--color-zal)]">
              Novice
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">›</li>
          <li aria-current="page" className="text-stone-700">{post.title}</li>
        </ol>
      </nav>

      {/* Main image */}
      {post.mainImage?.asset?.url && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={post.mainImage.asset.url}
            alt={post.mainImage.alt}
            className="h-72 w-full object-cover sm:h-96"
          />
        </div>
      )}

      {/* Meta */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <time dateTime={post.date} className="text-sm text-stone-400">
          {formatDate(post.date)}
        </time>
        {post.categories.map((c) => (
          <Link
            key={c._id}
            to={`/novice?kat=${c.slug}`}
            className="rounded-full bg-stone-100 px-3 py-0.5 text-xs text-stone-600 hover:bg-stone-200"
          >
            {c.title}
          </Link>
        ))}
      </div>

      <h1 className="mb-8 text-3xl font-bold text-[var(--color-zal)]">{post.title}</h1>

      <BlockList blocks={post.blocks as Parameters<typeof BlockList>[0]['blocks']} />
    </article>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 =
    error instanceof Response && error.status === 404
  return (
    <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="mb-4 text-6xl font-bold text-[var(--color-zal)]">
        {is404 ? '404' : 'Napaka'}
      </h1>
      <p className="text-lg text-stone-600">
        {is404 ? 'Novice ni mogoče najti.' : 'Prišlo je do nepričakovane napake.'}
      </p>
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
