import { describe, expect, it } from 'vitest'

import { buildMeta, ZAL_NAME, ZAL_ORIGIN, ZAL_OG_IMAGE } from './meta'

describe('buildMeta', () => {
  it('appends site-name suffix to document title', () => {
    const tags = buildMeta({ title: 'Novice', description: 'Opis.', pathname: '/novice' })
    expect(tags).toContainEqual({ title: 'Novice — ZAL' })
  })

  it('uses short title for og:title without suffix', () => {
    const tags = buildMeta({ title: 'Novice', description: 'Opis.', pathname: '/novice' })
    expect(tags).toContainEqual({ property: 'og:title', content: 'Novice' })
  })

  it('noSuffix: true emits title as-is (used on home)', () => {
    const tags = buildMeta({
      title: ZAL_NAME,
      description: 'Opis.',
      pathname: '/',
      noSuffix: true,
    })
    expect(tags).toContainEqual({ title: ZAL_NAME })
    expect(tags.find((t: Record<string, unknown>) => 'title' in t)).toEqual({ title: ZAL_NAME })
  })

  it('falls back to static OG image when ogImageUrl not provided', () => {
    const tags = buildMeta({ title: 'T', description: 'D', pathname: '/t' })
    expect(tags).toContainEqual({ property: 'og:image', content: ZAL_OG_IMAGE })
  })

  it('falls back when ogImageUrl is null', () => {
    const tags = buildMeta({ title: 'T', description: 'D', pathname: '/t', ogImageUrl: null })
    expect(tags).toContainEqual({ property: 'og:image', content: ZAL_OG_IMAGE })
  })

  it('uses provided ogImageUrl when given', () => {
    const img = 'https://cdn.sanity.io/images/x/y/z.jpg'
    const tags = buildMeta({ title: 'T', description: 'D', pathname: '/t', ogImageUrl: img })
    expect(tags).toContainEqual({ property: 'og:image', content: img })
  })

  it('builds canonical URL from ZAL_ORIGIN + pathname', () => {
    const tags = buildMeta({ title: 'T', description: 'D', pathname: '/novice/slug' })
    const canonical = `${ZAL_ORIGIN}/novice/slug`
    expect(tags).toContainEqual({ property: 'og:url', content: canonical })
    expect(tags).toContainEqual({ tagName: 'link', rel: 'canonical', href: canonical })
  })

  it('defaults og:type to website', () => {
    const tags = buildMeta({ title: 'T', description: 'D', pathname: '/' })
    expect(tags).toContainEqual({ property: 'og:type', content: 'website' })
  })

  it('uses article og:type for posts', () => {
    const tags = buildMeta({ title: 'T', description: 'D', pathname: '/novice/x', ogType: 'article' })
    expect(tags).toContainEqual({ property: 'og:type', content: 'article' })
  })

  it('includes description in both name:description and og:description', () => {
    const tags = buildMeta({ title: 'T', description: 'Opis.', pathname: '/t' })
    expect(tags).toContainEqual({ name: 'description', content: 'Opis.' })
    expect(tags).toContainEqual({ property: 'og:description', content: 'Opis.' })
  })

  it('includes og:site_name', () => {
    const tags = buildMeta({ title: 'T', description: 'D', pathname: '/t' })
    expect(tags).toContainEqual({ property: 'og:site_name', content: ZAL_NAME })
  })
})
