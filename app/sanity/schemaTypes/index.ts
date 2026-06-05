import type { SchemaTypeDefinition } from 'sanity'

import { figureType } from './objects/figure'
import { richTextBlockType } from './blocks/richTextBlock'
import { tableCellType, tableBlockType, tableRowType } from './blocks/tableBlock'
import { embedBlockType } from './blocks/embedBlock'
import { pageType } from './documents/page'
import { siteSettingsType } from './singletons/siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Objects
  figureType,
  tableCellType,
  tableRowType,
  // Blocks
  richTextBlockType,
  tableBlockType,
  embedBlockType,
  // Documents
  pageType,
  siteSettingsType,
]

export const SINGLETONS = ['siteSettings'] as const
