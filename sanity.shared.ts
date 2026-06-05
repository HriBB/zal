import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'

import { STUDIO_BASEPATH } from '~/sanity/constants'
import { defaultDocumentNode, structure } from '~/sanity/desk'
import { resolve } from '~/sanity/presentation/resolve'
import { schemaTypes } from '~/sanity/schemaTypes'

export const sharedSanityConfig = defineConfig({
  name: 'zal-studio',
  title: 'ZAL',
  projectId: '',
  dataset: '',
  apiVersion: '',
  basePath: STUDIO_BASEPATH,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    presentationTool({
      resolve,
      previewUrl: {
        initial: '/',
        previewMode: {
          enable: '/resource/preview',
        },
      },
    }),
    visionTool(),
  ],
})
