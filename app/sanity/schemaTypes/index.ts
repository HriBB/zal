import type { SchemaTypeDefinition } from 'sanity'

import { figureType } from './objects/figure'
import { hourSlotType } from './objects/hourSlot'
import { richTextBlockType } from './blocks/richTextBlock'
import { tableCellType, tableBlockType, tableRowType } from './blocks/tableBlock'
import { embedBlockType } from './blocks/embedBlock'
import { galleryBlockType } from './blocks/galleryBlock'
import { archiveUnitType } from './documents/archiveUnit'
import { categoryType } from './documents/category'
import { pageType } from './documents/page'
import { postType } from './documents/post'
import { siteSettingsType } from './singletons/siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Objects
  figureType,
  hourSlotType,
  tableCellType,
  tableRowType,
  // Blocks
  richTextBlockType,
  tableBlockType,
  embedBlockType,
  galleryBlockType,
  // Documents
  archiveUnitType,
  categoryType,
  pageType,
  postType,
  siteSettingsType,
]

export const SINGLETONS = ['siteSettings'] as const
