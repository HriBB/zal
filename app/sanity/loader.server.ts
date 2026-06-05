import * as queryStore from '@sanity/react-loader'

import { serverClient } from '~/sanity/client.server'
import { STUDIO_BASEPATH } from '~/sanity/constants'

const clientWithToken = serverClient.withConfig({
  stega: { studioUrl: STUDIO_BASEPATH },
})

queryStore.setServerClient(clientWithToken)

export const { loadQuery } = queryStore
