import { useMemo } from 'react'
import { Studio } from 'sanity'

import { sharedSanityConfig } from '../../sanity.shared'

export function SanityStudio() {
  const config = useMemo(
    () => ({
      ...sharedSanityConfig,
      projectId: import.meta.env.VITE_SANITY_PROJECT_ID ?? '',
      dataset: import.meta.env.VITE_SANITY_DATASET ?? '',
      apiVersion: import.meta.env.VITE_SANITY_API_VERSION ?? '2024-10-01',
    }),
    [],
  )
  return <Studio config={config} />
}
