import { defineConfig } from 'sanity'

import { sharedSanityConfig } from './sanity.shared'

export default defineConfig({
  ...sharedSanityConfig,
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.SANITY_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? process.env.SANITY_DATASET ?? '',
  apiVersion:
    process.env.SANITY_STUDIO_API_VERSION ??
    process.env.SANITY_API_VERSION ??
    '2024-10-01',
})
