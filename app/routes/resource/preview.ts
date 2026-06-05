import { redirect } from 'react-router'

import type { Route } from './+types/preview'

import { commitSession, destroySession, getSession } from '~/lib/session.server'
import { client } from '~/sanity/client'

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  return redirect('/', {
    headers: { 'Set-Cookie': await destroySession(session) },
  })
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const redirectTo =
    url.searchParams.get('sanity-preview-pathname') ||
    url.searchParams.get('redirect') ||
    '/'

  const session = await getSession(request.headers.get('Cookie'))
  session.set('projectId', client.config().projectId)

  return redirect(redirectTo, {
    headers: { 'Set-Cookie': await commitSession(session) },
  })
}
