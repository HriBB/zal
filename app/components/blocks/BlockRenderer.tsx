import { blockRegistry } from './blockRegistry'

import type { BlockComponentProps } from './blockRegistry'

type Block = {
  _type: string
  _key: string
} & Record<string, unknown>

export function BlockRenderer({ block }: { block: Block }) {
  const Component = blockRegistry[block._type]
  if (!Component) return null
  return <Component data={block} />
}

export function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block) => (
        <BlockRenderer key={block._key} block={block} />
      ))}
    </>
  )
}
