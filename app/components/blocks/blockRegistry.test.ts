import { describe, expect, test } from 'vitest'

import { schemaTypes } from '~/sanity/schemaTypes'
import { blockRegistry } from './blockRegistry'

describe('blockRegistry', () => {
  test('every registered block type has a matching Sanity schema type', () => {
    const schemaNames = new Set(schemaTypes.map((t) => t.name))
    for (const blockType of Object.keys(blockRegistry)) {
      expect(
        schemaNames.has(blockType),
        `block "${blockType}" registered but no matching schema type found`,
      ).toBe(true)
    }
  })

  test('registry has at least richTextBlock', () => {
    expect(Object.keys(blockRegistry)).toContain('richTextBlock')
  })
})
