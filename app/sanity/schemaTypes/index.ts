import type { SchemaTypeDefinition } from 'sanity'

import { figureType } from './objects/figure'
import { richTextBlockType } from './blocks/richTextBlock'
import { pageType } from './documents/page'
import { siteSettingsType } from './singletons/siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Objects
  figureType,
  // Blocks
  richTextBlockType,
  // Documents
  pageType,
  siteSettingsType,
]

export const SINGLETONS = ['siteSettings'] as const
