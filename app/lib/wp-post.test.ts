import { describe, expect, it } from 'vitest'

import { collapseCategories, wpPostToPostDoc } from './wp-post.ts'
import type { WpPost } from './wp-post.ts'

// ── collapseCategories ────────────────────────────────────────────────────────

describe('collapseCategories', () => {
  it('maps year variant to canonical slug', () => {
    // WP id 80 = "Arhivalija meseca 2014" → canonical "arhivalija-meseca"
    expect(collapseCategories([80])).toEqual(['arhivalija-meseca'])
  })

  it('deduplicates multiple year variants to one slug', () => {
    // WP ids 80 + 71 are both arhivalija-meseca year variants
    expect(collapseCategories([80, 71])).toEqual(['arhivalija-meseca'])
  })

  it('deduplicates year variant + parent to one slug', () => {
    // WP id 19 = parent "Arhivalija meseca"; 80 = year variant → same canonical
    expect(collapseCategories([19, 80])).toEqual(['arhivalija-meseca'])
  })

  it('maps multi-category post to multiple canonical slugs', () => {
    // 144 = dogodki-in-obvestila, 121 = obvestila
    expect(collapseCategories([144, 121])).toEqual(['dogodki-in-obvestila', 'obvestila'])
  })

  it('dissolves nerazvrsceno (id=1) — returns empty', () => {
    expect(collapseCategories([1])).toEqual([])
  })

  it('skips unknown category ids', () => {
    expect(collapseCategories([9999])).toEqual([])
  })

  it('preserves input order for multi-category', () => {
    // razstave (82) + obvestila (121) → order preserved
    expect(collapseCategories([82, 121])).toEqual(['razstave', 'obvestila'])
  })
})

// ── wpPostToPostDoc ───────────────────────────────────────────────────────────

describe('wpPostToPostDoc', () => {
  const noMedia: Map<number, { url: string; alt: string }> = new Map()

  it('produces stable _id and correct _type', () => {
    const doc = wpPostToPostDoc(makePost({ slug: 'moja-novica' }), noMedia)
    expect(doc._id).toBe('post.moja-novica')
    expect(doc._type).toBe('post')
  })

  it('passes through slug.current', () => {
    const doc = wpPostToPostDoc(makePost({ slug: 'test-slug' }), noMedia)
    expect(doc.slug.current).toBe('test-slug')
  })

  it('passes through date unchanged', () => {
    const doc = wpPostToPostDoc(makePost({ date: '2024-03-15T10:00:00' }), noMedia)
    expect(doc.date).toBe('2024-03-15T10:00:00')
  })

  it('decodes HTML entities in title', () => {
    const doc = wpPostToPostDoc(makePost({ title: { rendered: 'Razstava &#8211; ZAL' } }), noMedia)
    expect(doc.title).toBe('Razstava – ZAL')
  })

  it('extracts _oldPath from WP link', () => {
    const doc = wpPostToPostDoc(
      makePost({ link: 'https://www.zal-lj.si/2024/03/15/test-post/' }),
      noMedia,
    )
    expect(doc._oldPath).toBe('/2024/03/15/test-post/')
  })

  it('maps category ids to Sanity references', () => {
    const doc = wpPostToPostDoc(makePost({ categories: [144, 121] }), noMedia)
    expect(doc.categories).toEqual([
      { _type: 'reference', _key: 'cat-0', _ref: 'category.dogodki-in-obvestila' },
      { _type: 'reference', _key: 'cat-1', _ref: 'category.obvestila' },
    ])
  })

  it('has empty categories when nerazvrsceno only', () => {
    const doc = wpPostToPostDoc(makePost({ categories: [1] }), noMedia)
    expect(doc.categories).toEqual([])
  })

  it('resolves mainImage from mediaById when featured_media > 0', () => {
    const media = new Map([
      [55, { url: 'https://www.zal-lj.si/files/img.jpg', alt: 'Test' }],
    ])
    const doc = wpPostToPostDoc(makePost({ featured_media: 55 }), media)
    expect(doc.mainImage).toEqual({ url: 'https://www.zal-lj.si/files/img.jpg', alt: 'Test' })
  })

  it('has no mainImage when featured_media is 0', () => {
    const doc = wpPostToPostDoc(makePost({ featured_media: 0 }), noMedia)
    expect(doc.mainImage).toBeUndefined()
  })

  it('has no mainImage when featured_media not in mediaById', () => {
    const doc = wpPostToPostDoc(makePost({ featured_media: 999 }), noMedia)
    expect(doc.mainImage).toBeUndefined()
  })

  it('produces at least one block for HTML content', () => {
    const doc = wpPostToPostDoc(makePost({ content: { rendered: '<p>Hello world</p>' } }), noMedia)
    expect(doc.blocks.length).toBeGreaterThan(0)
    expect(doc.blocks[0]._type).toBe('richTextBlock')
  })
})

// ── helpers ───────────────────────────────────────────────────────────────────

function makePost(overrides: Partial<WpPost> = {}): WpPost {
  return {
    id: 1,
    slug: 'test',
    title: { rendered: 'Test' },
    content: { rendered: '<p>Vsebina.</p>' },
    date: '2024-01-01T00:00:00',
    link: 'https://www.zal-lj.si/2024/01/01/test/',
    categories: [],
    featured_media: 0,
    ...overrides,
  }
}
