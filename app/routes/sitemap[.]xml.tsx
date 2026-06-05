import type { Route } from './+types/sitemap[.]xml'

import { buildPagePath } from '~/lib/redirects'
import { buildSitemapXml } from '~/lib/sitemap'
import { serverClient } from '~/sanity/client.server'
import type {
  SitemapArchiveItem,
  SitemapCollection,
  SitemapPage,
  SitemapPost,
} from '~/sanity/queries'
import {
  sitemapArchiveItemsQuery,
  sitemapCollectionsQuery,
  sitemapPagesQuery,
  sitemapPostsQuery,
} from '~/sanity/queries'

export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin

  const [pages, posts, collections, archiveItems] = await Promise.all([
    serverClient.fetch<SitemapPage[]>(sitemapPagesQuery.query),
    serverClient.fetch<SitemapPost[]>(sitemapPostsQuery.query),
    serverClient.fetch<SitemapCollection[]>(sitemapCollectionsQuery.query),
    serverClient.fetch<SitemapArchiveItem[]>(sitemapArchiveItemsQuery.query),
  ])

  const staticPaths = ['/', '/novice', '/arhivalija-meseca', '/digiteka']

  const entries = [
    ...staticPaths.map((p) => ({ loc: `${origin}${p}` })),
    ...pages.map((p) => ({
      loc: `${origin}${buildPagePath([p.greatGrandParentSlug, p.grandParentSlug, p.parentSlug, p.slug])}`,
      lastmod: p._updatedAt,
    })),
    ...posts.map((p) => ({
      loc: `${origin}/novice/${p.slug}`,
      lastmod: p._updatedAt,
    })),
    ...collections.map((c) => ({
      loc: `${origin}/digiteka/${c.slug}`,
      lastmod: c._updatedAt,
    })),
    ...archiveItems.map((item) => ({
      loc: `${origin}/digiteka/${item.collectionSlug}/${item.slug}`,
      lastmod: item._updatedAt,
    })),
  ]

  return new Response(buildSitemapXml(entries), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
