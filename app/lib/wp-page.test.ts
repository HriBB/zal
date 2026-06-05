import { describe, expect, test } from 'vitest'

import { cleanSlugForPage, wpPageToPageDoc } from './wp-page'

// ── cleanSlugForPage ───────────────────────────────────────────────────────────

describe('cleanSlugForPage', () => {
  test('maps o-arhivu-2 (id=3987) to o-arhivu', () => {
    expect(cleanSlugForPage(3987, 'o-arhivu-2')).toBe('o-arhivu')
  })

  test('maps za-uporabnike-2 (id=3997) to za-uporabnike', () => {
    expect(cleanSlugForPage(3997, 'za-uporabnike-2')).toBe('za-uporabnike')
  })

  test('maps za-uporabnike-3 (id=3990) to za-ustvarjalce', () => {
    expect(cleanSlugForPage(3990, 'za-uporabnike-3')).toBe('za-ustvarjalce')
  })

  test('maps za-ustvarjalce (id=3992, title=Publikacije) to publikacije', () => {
    expect(cleanSlugForPage(3992, 'za-ustvarjalce')).toBe('publikacije')
  })

  test('leaves leaf page slugs unchanged', () => {
    expect(cleanSlugForPage(943, 'kontakti')).toBe('kontakti')
  })

  test('leaves unknown ids unchanged', () => {
    expect(cleanSlugForPage(9999, 'some-slug')).toBe('some-slug')
  })
})

// ── wpPageToPageDoc ────────────────────────────────────────────────────────────

const mockWpPage = {
  id: 943,
  slug: 'kontakti',
  title: { rendered: 'Kontakti' },
  content: { rendered: '<p>Besedilo.</p>' },
  parent: 3987,
  link: 'https://www.zal-lj.si/domaca-stran-1/o-arhivu-2/kontakti/',
}

describe('wpPageToPageDoc', () => {
  test('generates stable _id from clean slug', () => {
    const doc = wpPageToPageDoc(mockWpPage, 'kontakti', 'page.o-arhivu')
    expect(doc._id).toBe('page.kontakti')
    expect(doc._type).toBe('page')
  })

  test('sets slug.current to the clean slug', () => {
    const doc = wpPageToPageDoc(mockWpPage, 'kontakti', 'page.o-arhivu')
    expect(doc.slug).toEqual({ _type: 'slug', current: 'kontakti' })
  })

  test('sets parent reference from parentRef arg', () => {
    const doc = wpPageToPageDoc(mockWpPage, 'kontakti', 'page.o-arhivu')
    expect(doc.parent).toEqual({ _type: 'reference', _ref: 'page.o-arhivu' })
  })

  test('omits parent when parentRef is null', () => {
    const doc = wpPageToPageDoc(
      { ...mockWpPage, parent: 0 },
      'o-arhivu',
      null,
    )
    expect(doc.parent).toBeUndefined()
  })

  test('records old WP path from page link', () => {
    const doc = wpPageToPageDoc(mockWpPage, 'kontakti', 'page.o-arhivu')
    expect(doc._oldPath).toBe('/domaca-stran-1/o-arhivu-2/kontakti/')
  })

  test('decodes HTML entities in title', () => {
    const page = { ...mockWpPage, title: { rendered: 'Arhiv &amp; Gradivo' } }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    expect(doc.title).toBe('Arhiv & Gradivo')
  })

  test('creates a single richTextBlock from content', () => {
    const doc = wpPageToPageDoc(mockWpPage, 'kontakti', 'page.o-arhivu')
    expect(doc.blocks).toHaveLength(1)
    expect(doc.blocks[0]._type).toBe('richTextBlock')
    expect(doc.blocks[0].body.length).toBeGreaterThan(0)
  })

  test('empty content produces a richTextBlock with empty body', () => {
    const page = { ...mockWpPage, content: { rendered: '' } }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    expect(doc.blocks[0].body).toHaveLength(0)
  })
})
