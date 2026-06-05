import type { Route } from './+types/robots[.]txt'

export function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin
  const body = `User-agent: *
Allow: /
Disallow: /studio
Disallow: /resource

Sitemap: ${origin}/sitemap.xml
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
