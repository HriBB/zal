import { describe, expect, it } from 'vitest'

import { homePageType } from './homePage'

describe('homePageType schema', () => {
  const fieldNames = homePageType.fields.map((f) => f.name)

  it('is a document type named homePage', () => {
    expect(homePageType.type).toBe('document')
    expect(homePageType.name).toBe('homePage')
  })

  it('has hero field', () => {
    expect(fieldNames).toContain('hero')
  })

  it('has serviceCards field', () => {
    expect(fieldNames).toContain('serviceCards')
  })

  it('hero object has heading, lead, image subfields', () => {
    const hero = homePageType.fields.find((f) => f.name === 'hero')
    expect(hero).toBeDefined()
    // hero is type 'object' — check its fields
    const heroFields = (hero as { fields?: Array<{ name: string }> }).fields ?? []
    const heroFieldNames = heroFields.map((f) => f.name)
    expect(heroFieldNames).toContain('heading')
    expect(heroFieldNames).toContain('lead')
    expect(heroFieldNames).toContain('image')
  })

  it('serviceCards items have title, href, description', () => {
    const cards = homePageType.fields.find((f) => f.name === 'serviceCards')
    expect(cards).toBeDefined()
    const of_ = (cards as { of?: Array<{ fields?: Array<{ name: string }> }> }).of ?? []
    expect(of_.length).toBeGreaterThan(0)
    const itemFields = (of_[0].fields ?? []).map((f) => f.name)
    expect(itemFields).toContain('title')
    expect(itemFields).toContain('href')
    expect(itemFields).toContain('description')
  })
})
