import type { ComponentType } from 'react'

import { EmbedBlock } from './EmbedBlock'
import { GalleryBlock } from './GalleryBlock'
import { RichTextBlock } from './RichTextBlock'
import { TableBlock } from './TableBlock'

// Block data is dynamic and typed per-renderer at access time
export type BlockComponentProps = { data: any }

/**
 * Single source of truth: block _type → React component.
 * The page schema derives its pageBuilder array members from Object.keys(blockRegistry),
 * and BlockRenderer dispatches through this map — so a block registered here
 * cannot drift from the schema.
 */
export const blockRegistry: Record<string, ComponentType<BlockComponentProps>> = {
  richTextBlock: RichTextBlock,
  tableBlock: TableBlock,
  embedBlock: EmbedBlock,
  galleryBlock: GalleryBlock,
}
