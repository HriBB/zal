import { describe, expect, it } from 'vitest'

import { archiveItemType } from './archiveItem'

describe('archiveItemType schema', () => {
  const fieldNames = archiveItemType.fields.map((f) => f.name)

  it('is a document type named archiveItem', () => {
    expect(archiveItemType.type).toBe('document')
    expect(archiveItemType.name).toBe('archiveItem')
  })

  it('has identity fields: title, slug', () => {
    expect(fieldNames).toContain('title')
    expect(fieldNames).toContain('slug')
  })

  it('has collection reference', () => {
    expect(fieldNames).toContain('collection')
    const collField = archiveItemType.fields.find((f) => f.name === 'collection')
    expect(collField?.type).toBe('reference')
  })

  it('has metadata array for label/value pairs', () => {
    expect(fieldNames).toContain('metadata')
  })

  it('has gallery array for scan figures', () => {
    expect(fieldNames).toContain('gallery')
  })

  it('has optional externalUrl for SIstory links', () => {
    expect(fieldNames).toContain('externalUrl')
  })

  it('has _oldPath for redirect map', () => {
    expect(fieldNames).toContain('_oldPath')
  })
})
