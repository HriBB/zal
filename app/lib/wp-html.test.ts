import { describe, expect, test } from 'vitest'

import type { PortableTextBlock } from './wp-html'

import { cleanWpHtml, cutDiviFooter, normalizeHost } from './wp-html'

// ── cutDiviFooter ──────────────────────────────────────────────────────────────

describe('cutDiviFooter', () => {
  test('cuts at the Divi kontakt section div', () => {
    const html =
      '<p>Content</p><div id="kontakt" class="et_pb_section">footer</div>'
    expect(cutDiviFooter(html)).toBe('<p>Content</p>')
  })

  test('returns html unchanged when no kontakt div present', () => {
    const html = '<p>No footer here</p>'
    expect(cutDiviFooter(html)).toBe('<p>No footer here</p>')
  })

  test('cuts regardless of attribute order around id="kontakt"', () => {
    const html =
      '<p>Content</p><div class="et_pb_section" id="kontakt">footer</div>'
    expect(cutDiviFooter(html)).toBe('<p>Content</p>')
  })
})

// ── normalizeHost ──────────────────────────────────────────────────────────────

describe('normalizeHost', () => {
  test('replaces zal-lj.splet.arnes.si with www.zal-lj.si', () => {
    expect(normalizeHost('http://zal-lj.splet.arnes.si/files/img.jpg')).toBe(
      'https://www.zal-lj.si/files/img.jpg',
    )
  })

  test('replaces https variant of arnes host', () => {
    expect(
      normalizeHost('https://zal-lj.splet.arnes.si/project/test/'),
    ).toBe('https://www.zal-lj.si/project/test/')
  })

  test('leaves www.zal-lj.si unchanged', () => {
    expect(normalizeHost('https://www.zal-lj.si/files/img.jpg')).toBe(
      'https://www.zal-lj.si/files/img.jpg',
    )
  })

  test('leaves external hosts unchanged', () => {
    expect(normalizeHost('https://example.com/path')).toBe(
      'https://example.com/path',
    )
  })
})

// ── cleanWpHtml ─────────────────────────────────────────────────────────────

describe('cleanWpHtml', () => {
  test('decodes Slovenian diacritic characters (š/č/ž via numeric entities)', () => {
    const result = cleanWpHtml('<p>&#353;&#269;&#382;</p>')
    const block = result.portableText[0] as PortableTextBlock
    expect(block.children[0].text).toBe('šč​ž'.replace('​', ''))
    // &#353; = š, &#269; = č, &#382; = ž
    expect(block.children[0].text).toBe('šč​ž'.replace('​', ''))
  })

  test('decodes named entities including Slovenian š via &scaron;', () => {
    const result = cleanWpHtml('<p>&scaron;&amp;</p>')
    const block = result.portableText[0] as PortableTextBlock
    expect(block.children[0].text).toBe('š&')
  })

  test('preserves h2 heading as portable text style h2', () => {
    const result = cleanWpHtml('<h2>Naslov</h2>')
    const block = result.portableText[0] as PortableTextBlock
    expect(block._type).toBe('block')
    expect(block.style).toBe('h2')
    expect(block.children[0].text).toBe('Naslov')
  })

  test('preserves h3 heading as portable text style h3', () => {
    const result = cleanWpHtml('<h3>Podnaslov</h3>')
    const block = result.portableText[0] as PortableTextBlock
    expect(block.style).toBe('h3')
  })

  test('preserves bullet lists', () => {
    const result = cleanWpHtml('<ul><li>Prva</li><li>Druga</li></ul>')
    expect(result.portableText).toHaveLength(2)
    const item = result.portableText[0] as PortableTextBlock
    expect(item.listItem).toBe('bullet')
    expect(item.level).toBe(1)
    expect(item.children[0].text).toBe('Prva')
  })

  test('preserves numbered lists', () => {
    const result = cleanWpHtml('<ol><li>Ena</li><li>Dve</li></ol>')
    const item = result.portableText[0] as PortableTextBlock
    expect(item.listItem).toBe('number')
  })

  test('preserves links with href normalised from arnes to www', () => {
    const result = cleanWpHtml(
      '<p><a href="http://zal-lj.splet.arnes.si/about">Link</a></p>',
    )
    const block = result.portableText[0] as PortableTextBlock
    const markDef = block.markDefs[0]
    expect(markDef._type).toBe('link')
    expect(markDef.href).toBe('https://www.zal-lj.si/about')
  })

  test('preserves blockquotes', () => {
    const result = cleanWpHtml('<blockquote><p>Citat</p></blockquote>')
    const block = result.portableText[0] as PortableTextBlock
    expect(block.style).toBe('blockquote')
  })

  test('strips <style> tags including their content', () => {
    const result = cleanWpHtml(
      '<style>.gallery{margin:0}</style><p>Proza</p>',
    )
    const block = result.portableText[0] as PortableTextBlock
    expect(block.children[0].text).toBe('Proza')
    expect(JSON.stringify(result.portableText)).not.toContain('gallery')
  })

  test('strips Divi [et_pb_*] shortcodes leaving surrounding prose intact', () => {
    const result = cleanWpHtml(
      '<p>[et_pb_text]Proza[/et_pb_text]</p>',
    )
    const block = result.portableText[0] as PortableTextBlock
    expect(block.children[0].text).toBe('Proza')
    expect(JSON.stringify(result.portableText)).not.toContain('et_pb')
  })

  test('strips [gallery] shortcodes', () => {
    const result = cleanWpHtml('<p>[gallery ids="1,2,3"]</p><p>Proza</p>')
    const block = result.portableText[0] as PortableTextBlock
    expect(block.children[0].text).toBe('Proza')
  })

  test('preserves inline figure and also lifts it to gallery', () => {
    const html =
      '<p><img src="https://www.zal-lj.si/files/photo.jpg" alt="Opis" /></p>'
    const result = cleanWpHtml(html)
    expect(result.gallery).toHaveLength(1)
    expect(result.gallery[0].src).toBe('https://www.zal-lj.si/files/photo.jpg')
    expect(result.gallery[0].alt).toBe('Opis')
    const fig = result.portableText[0]
    expect(fig._type).toBe('figure')
  })

  test('strips WP resize suffix from image src to recover original', () => {
    const html =
      '<p><img src="https://www.zal-lj.si/files/photo-300x200.jpg" alt="A" /></p>'
    const result = cleanWpHtml(html)
    expect(result.gallery[0].src).toBe(
      'https://www.zal-lj.si/files/photo.jpg',
    )
  })

  test('normalises arnes host on image src', () => {
    const html =
      '<p><img src="http://zal-lj.splet.arnes.si/files/photo.jpg" alt="A" /></p>'
    const result = cleanWpHtml(html)
    expect(result.gallery[0].src).toBe('https://www.zal-lj.si/files/photo.jpg')
  })

  test('returns empty portableText for empty or null input', () => {
    expect(cleanWpHtml('').portableText).toHaveLength(0)
    expect(cleanWpHtml(null).portableText).toHaveLength(0)
  })
})
