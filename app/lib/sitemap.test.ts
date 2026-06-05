import { describe, expect, test } from 'vitest'

import { buildSitemapXml } from './sitemap'

describe('buildSitemapXml', () => {
  test('produces valid XML envelope', () => {
    const xml = buildSitemapXml([])
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('</urlset>')
  })

  test('includes loc for each entry', () => {
    const xml = buildSitemapXml([
      { loc: 'https://www.zal-lj.si/' },
      { loc: 'https://www.zal-lj.si/novice' },
    ])
    expect(xml).toContain('<loc>https://www.zal-lj.si/</loc>')
    expect(xml).toContain('<loc>https://www.zal-lj.si/novice</loc>')
  })

  test('includes lastmod truncated to date when provided', () => {
    const xml = buildSitemapXml([{ loc: 'https://x.com/', lastmod: '2024-01-15T10:00:00Z' }])
    expect(xml).toContain('<lastmod>2024-01-15</lastmod>')
  })

  test('omits lastmod tag when absent', () => {
    const xml = buildSitemapXml([{ loc: 'https://x.com/' }])
    expect(xml).not.toContain('lastmod')
  })

  test('escapes & in loc', () => {
    const xml = buildSitemapXml([{ loc: 'https://x.com/?a=1&b=2' }])
    expect(xml).toContain('&amp;')
    // unescaped literal & must not appear inside element content
    expect(xml).not.toMatch(/<[^>]*>[^<]*&[^a][^m]/)
  })
})
