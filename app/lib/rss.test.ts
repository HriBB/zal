import { describe, expect, test } from 'vitest'

import { buildRssFeed } from './rss'

const channel = {
  title: 'ZAL Novice',
  link: 'https://www.zal-lj.si',
  description: 'Novice Zgodovinskega arhiva Ljubljana',
}

describe('buildRssFeed', () => {
  test('produces valid RSS 2.0 envelope', () => {
    const xml = buildRssFeed(channel, [])
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<channel>')
    expect(xml).toContain('</channel>')
    expect(xml).toContain('</rss>')
  })

  test('includes channel metadata', () => {
    const xml = buildRssFeed(channel, [])
    expect(xml).toContain('<title>ZAL Novice</title>')
    expect(xml).toContain('<link>https://www.zal-lj.si</link>')
    expect(xml).toContain('<description>Novice Zgodovinskega arhiva Ljubljana</description>')
  })

  test('includes item elements for each post', () => {
    const xml = buildRssFeed(channel, [
      {
        title: 'Novica ena',
        link: 'https://www.zal-lj.si/novice/novica-ena',
        pubDate: '2024-01-15',
        guid: 'https://www.zal-lj.si/novice/novica-ena',
      },
    ])
    expect(xml).toContain('<item>')
    expect(xml).toContain('<title>Novica ena</title>')
    expect(xml).toContain('<link>https://www.zal-lj.si/novice/novica-ena</link>')
    expect(xml).toContain('<guid>')
    expect(xml).toContain('</item>')
  })

  test('empty feed has no item elements', () => {
    const xml = buildRssFeed(channel, [])
    expect(xml).not.toContain('<item>')
  })

  test('escapes XML-special characters in title', () => {
    const xml = buildRssFeed(channel, [
      {
        title: 'Novica & <test>',
        link: 'https://x.com/',
        pubDate: '2024-01-01',
        guid: 'g1',
      },
    ])
    expect(xml).toContain('&amp;')
    expect(xml).toContain('&lt;')
  })
})
