import { describe, expect, it } from 'vitest'

import {
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd,
  buildNewsArticleJsonLd,
} from './jsonld'

const STUB_UNITS = [
  { name: 'ZAL Ljubljana', address: 'Mestni trg 27', slug: 'ljubljana' },
  { name: 'ZAL Kranj', address: 'Stara cesta 1', slug: 'kranj' },
]

describe('buildOrganizationJsonLd', () => {
  it('@type is ArchiveOrganization', () => {
    const ld = buildOrganizationJsonLd(STUB_UNITS, 'https://www.zal-lj.si')
    expect(ld['@type']).toBe('ArchiveOrganization')
  })

  it('@context is schema.org', () => {
    const ld = buildOrganizationJsonLd(STUB_UNITS, 'https://www.zal-lj.si')
    expect(ld['@context']).toBe('https://schema.org')
  })

  it('maps units to location Place items', () => {
    const ld = buildOrganizationJsonLd(STUB_UNITS, 'https://www.zal-lj.si')
    const locations = ld['location'] as object[]
    expect(locations).toHaveLength(2)
    expect(locations[0]).toMatchObject({ '@type': 'Place', name: 'ZAL Ljubljana' })
  })

  it('builds unit URL from origin + slug', () => {
    const ld = buildOrganizationJsonLd(STUB_UNITS, 'https://www.zal-lj.si')
    const locations = ld['location'] as Array<Record<string, string>>
    expect(locations[0]!['url']).toBe('https://www.zal-lj.si/enote/ljubljana')
  })

  it('includes address on each location', () => {
    const ld = buildOrganizationJsonLd(STUB_UNITS, 'https://www.zal-lj.si')
    const locations = ld['location'] as Array<Record<string, string>>
    expect(locations[0]!['address']).toBe('Mestni trg 27')
  })
})

describe('buildBreadcrumbJsonLd', () => {
  const items = [
    { name: 'Domov', url: 'https://www.zal-lj.si/' },
    { name: 'O arhivu', url: 'https://www.zal-lj.si/o-arhivu' },
    { name: 'Zgodovina', url: 'https://www.zal-lj.si/o-arhivu/zgodovina' },
  ]

  it('@type is BreadcrumbList', () => {
    const ld = buildBreadcrumbJsonLd(items)
    expect(ld['@type']).toBe('BreadcrumbList')
  })

  it('positions are 1-indexed', () => {
    const ld = buildBreadcrumbJsonLd(items)
    const list = ld['itemListElement'] as Array<Record<string, unknown>>
    expect(list[0]!['position']).toBe(1)
    expect(list[2]!['position']).toBe(3)
  })

  it('each item has name and item (URL)', () => {
    const ld = buildBreadcrumbJsonLd(items)
    const list = ld['itemListElement'] as Array<Record<string, string>>
    expect(list[1]!['name']).toBe('O arhivu')
    expect(list[1]!['item']).toBe('https://www.zal-lj.si/o-arhivu')
  })

  it('each item @type is ListItem', () => {
    const ld = buildBreadcrumbJsonLd(items)
    const list = ld['itemListElement'] as Array<Record<string, string>>
    expect(list[0]!['@type']).toBe('ListItem')
  })
})

describe('buildNewsArticleJsonLd', () => {
  it('@type is NewsArticle', () => {
    const ld = buildNewsArticleJsonLd({
      title: 'Novica',
      url: 'https://www.zal-lj.si/novice/novica',
      datePublished: '2024-01-15',
    })
    expect(ld['@type']).toBe('NewsArticle')
  })

  it('headline, url, datePublished are set', () => {
    const ld = buildNewsArticleJsonLd({
      title: 'Novica',
      url: 'https://www.zal-lj.si/novice/novica',
      datePublished: '2024-01-15',
    })
    expect(ld['headline']).toBe('Novica')
    expect(ld['url']).toBe('https://www.zal-lj.si/novice/novica')
    expect(ld['datePublished']).toBe('2024-01-15')
  })

  it('includes image when imageUrl provided', () => {
    const ld = buildNewsArticleJsonLd({
      title: 'N',
      url: 'https://www.zal-lj.si/novice/n',
      datePublished: '2024-01-15',
      imageUrl: 'https://cdn.sanity.io/img.jpg',
    })
    expect(ld['image']).toBe('https://cdn.sanity.io/img.jpg')
  })

  it('omits image when imageUrl not provided', () => {
    const ld = buildNewsArticleJsonLd({
      title: 'N',
      url: 'https://www.zal-lj.si/novice/n',
      datePublished: '2024-01-15',
    })
    expect('image' in ld).toBe(false)
  })

  it('includes publisher Organization', () => {
    const ld = buildNewsArticleJsonLd({
      title: 'N',
      url: 'https://www.zal-lj.si/novice/n',
      datePublished: '2024-01-15',
    })
    const pub = ld['publisher'] as Record<string, string>
    expect(pub['@type']).toBe('Organization')
    expect(pub['name']).toBe('Zgodovinski arhiv Ljubljana')
  })
})
