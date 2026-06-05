import type { loadQuery } from '@sanity/react-loader'

import { getSession } from '~/lib/session.server'
import { client } from '~/sanity/client'
import { STUDIO_BASEPATH } from '~/sanity/constants'

export async function loadQueryOptions(
  headers: Headers,
): Promise<{ preview: boolean; options: Parameters<typeof loadQuery>[2] }> {
  const previewSession = await getSession(headers.get('Cookie'))
  const preview = previewSession.get('projectId') === client.config().projectId

  if (preview && !process.env.SANITY_READ_TOKEN) {
    throw new Error(
      'Cannot activate preview mode without a "SANITY_READ_TOKEN" in your environment.',
    )
  }

  return {
    preview,
    options: {
      perspective: preview ? 'drafts' : 'published',
      stega: preview ? { enabled: true, studioUrl: STUDIO_BASEPATH } : undefined,
    },
  }
}
