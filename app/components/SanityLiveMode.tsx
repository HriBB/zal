import { useLiveMode } from '@sanity/react-loader'

import { client } from '~/sanity/client'
import { STUDIO_BASEPATH } from '~/sanity/constants'

const liveClient = client.withConfig({
  stega: { enabled: true, studioUrl: STUDIO_BASEPATH },
})

// Opens the live connection to the Studio so `useQuery` subscriptions stream
// content updates as the editor types. Render only in preview mode.
export function SanityLiveMode() {
  useLiveMode({ client: liveClient })
  return null
}
