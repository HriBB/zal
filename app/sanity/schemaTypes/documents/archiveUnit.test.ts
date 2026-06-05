import { describe, expect, it } from 'vitest'

import { archiveUnitType } from './archiveUnit'

describe('archiveUnitType schema', () => {
  const fieldNames = archiveUnitType.fields.map((f) => f.name)

  it('is a document type named archiveUnit', () => {
    expect(archiveUnitType.type).toBe('document')
    expect(archiveUnitType.name).toBe('archiveUnit')
  })

  it('has identity fields: name, slug', () => {
    expect(fieldNames).toContain('name')
    expect(fieldNames).toContain('slug')
  })

  it('has contact fields: address, phones, emails', () => {
    expect(fieldNames).toContain('address')
    expect(fieldNames).toContain('phones')
    expect(fieldNames).toContain('emails')
  })

  it('has hours fields: officeHours, readingRoomHours', () => {
    expect(fieldNames).toContain('officeHours')
    expect(fieldNames).toContain('readingRoomHours')
  })

  it('has mapUrl for Google Maps embed', () => {
    expect(fieldNames).toContain('mapUrl')
  })

  it('has _oldPath for redirect map', () => {
    expect(fieldNames).toContain('_oldPath')
  })
})
