import type { ComponentType } from 'react'

import { RichTextBlock } from './RichTextBlock'

export type BlockComponentProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

/**
 * Single source of truth: block _type → React component.
 * The page schema derives its pageBuilder array members from Object.keys(blockRegistry),
 * and BlockRenderer dispatches through this map — so a block registered here
 * cannot drift from the schema.
 */
export const blockRegistry: Record<string, ComponentType<BlockComponentProps>> = {
  richTextBlock: RichTextBlock,
}
