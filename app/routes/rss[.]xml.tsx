import type { Route } from './+types/rss[.]xml'

import { buildRssFeed } from '~/lib/rss'
import { serverClient } from '~/sanity/client.server'
import type { RssFeedPost } from '~/sanity/queries'
import { rssFeedQuery } from '~/sanity/queries'

export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin
  const posts = await serverClient.fetch<RssFeedPost[]>(rssFeedQuery.query)

  const feed = buildRssFeed(
    {
      title: 'ZAL – Novice',
      link: origin,
      description: 'Novice Zgodovinskega arhiva Ljubljana',
    },
    posts.map((p) => ({
      title: p.title,
      link: `${origin}/novice/${p.slug}`,
      pubDate: p.date,
      guid: `${origin}/novice/${p.slug}`,
    })),
  )

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
