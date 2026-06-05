import { describe, expect, it } from 'vitest'

import { collectionType } from './collection'

describe('collectionType schema', () => {
  const fieldNames = collectionType.fields.map((f) => f.name)

  it('is a document type named collection', () => {
    expect(collectionType.type).toBe('document')
    expect(collectionType.name).toBe('collection')
  })

  it('has identity fields: name, slug', () => {
    expect(fieldNames).toContain('name')
    expect(fieldNames).toContain('slug')
  })

  it('has optional externalUrl for SIstory-linked collections', () => {
    expect(fieldNames).toContain('externalUrl')
  })

  it('has _oldPath for redirect map', () => {
    expect(fieldNames).toContain('_oldPath')
  })
})
