import type { SchemaTypeDefinition } from 'sanity'

import { figureType } from './objects/figure'
import { hourSlotType } from './objects/hourSlot'
import { richTextBlockType } from './blocks/richTextBlock'
import { tableCellType, tableBlockType, tableRowType } from './blocks/tableBlock'
import { embedBlockType } from './blocks/embedBlock'
import { galleryBlockType } from './blocks/galleryBlock'
import { archiveItemType } from './documents/archiveItem'
import { archiveUnitType } from './documents/archiveUnit'
import { categoryType } from './documents/category'
import { collectionType } from './documents/collection'
import { pageType } from './documents/page'
import { postType } from './documents/post'
import { homePageType } from './singletons/homePage'
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
  archiveItemType,
  archiveUnitType,
  categoryType,
  collectionType,
  pageType,
  postType,
  homePageType,
  siteSettingsType,
]

export const SINGLETONS = ['siteSettings', 'homePage'] as const
