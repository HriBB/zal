import { describe, expect, it } from 'vitest'

import {
  buildArchiveItemPreviewUrl,
  buildCollectionPreviewUrl,
  buildPagePreviewUrl,
  buildPostPreviewUrl,
} from './url-builders'

describe('buildPagePreviewUrl', () => {
  it('top-level page → /:slug', () => {
    expect(buildPagePreviewUrl('kontakti')).toBe('/kontakti')
  })

  it('page with one parent → /:parent/:slug', () => {
    expect(buildPagePreviewUrl('kontakti', { slug: 'o-arhivu' })).toBe('/o-arhivu/kontakti')
  })

  it('page with two-level ancestor → /:grandparent/:parent/:slug', () => {
    expect(
      buildPagePreviewUrl('podrobnosti', {
        slug: 'kontakti',
        parent: { slug: 'o-arhivu' },
      }),
    ).toBe('/o-arhivu/kontakti/podrobnosti')
  })

  it('null ancestor treated as top-level', () => {
    expect(buildPagePreviewUrl('domov', null)).toBe('/domov')
  })
})

describe('buildPostPreviewUrl', () => {
  it('maps slug to /novice/:slug', () => {
    expect(buildPostPreviewUrl('razstava-april-2024')).toBe('/novice/razstava-april-2024')
  })
})

describe('buildArchiveItemPreviewUrl', () => {
  it('maps collection + slug to /digiteka/:collection/:slug', () => {
    expect(buildArchiveItemPreviewUrl('kodeksi', 'cod-i-knjiga-43-1674')).toBe(
      '/digiteka/kodeksi/cod-i-knjiga-43-1674',
    )
  })
})

describe('buildCollectionPreviewUrl', () => {
  it('maps slug to /digiteka/:slug', () => {
    expect(buildCollectionPreviewUrl('listine')).toBe('/digiteka/listine')
  })
})
