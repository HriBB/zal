import { describe, expect, test } from 'vitest'

import type { PortableTextBlock } from './wp-html'

import { cleanWpHtml, cutDiviFooter, extractTable, normalizeHost, splitHtmlSegments } from './wp-html'

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

// ── extractTable ──────────────────────────────────────────────────────────────

describe('extractTable', () => {
  test('extracts rows and cells from basic 2×2 table', () => {
    const html =
      '<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>'
    const result = extractTable(html)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].cells).toHaveLength(2)
    expect(result.rows[0].cells[0].text).toBe('A')
    expect(result.rows[0].cells[1].text).toBe('B')
    expect(result.rows[1].cells[0].text).toBe('C')
  })

  test('marks row as header when cells use <th>', () => {
    const html =
      '<table><tbody><tr><th>Naslov</th><th>Vrednost</th></tr><tr><td>A</td><td>B</td></tr></tbody></table>'
    const result = extractTable(html)
    expect(result.rows[0].isHeader).toBe(true)
    expect(result.rows[1].isHeader).toBe(false)
  })

  test('marks row as header when row is in <thead>', () => {
    const html =
      '<table><thead><tr><td>Header</td></tr></thead><tbody><tr><td>Body</td></tr></tbody></table>'
    const result = extractTable(html)
    expect(result.rows[0].isHeader).toBe(true)
    expect(result.rows[1].isHeader).toBe(false)
  })

  test('marks first row as header when all cells are all-strong (first-row heuristic)', () => {
    const html =
      '<table><tbody><tr><td><strong>Col A</strong></td><td><strong>Col B</strong></td></tr><tr><td>val1</td><td>val2</td></tr></tbody></table>'
    const result = extractTable(html)
    expect(result.rows[0].isHeader).toBe(true)
    expect(result.rows[1].isHeader).toBe(false)
  })

  test('does NOT mark first row as header when cells have mixed content (ZAL pattern)', () => {
    const html =
      '<table><tbody><tr><td><strong>Čitalnica</strong><br/>ponedeljek</td><td>ZAL</td></tr><tr><td>A</td><td>B</td></tr></tbody></table>'
    const result = extractTable(html)
    expect(result.rows[0].isHeader).toBe(false)
  })

  test('flattens nested markup to text: br→space, tags stripped, entities decoded', () => {
    const html =
      '<table><tbody><tr><td><strong>Čitalnica</strong><br/>ponedeljek &amp; torek</td></tr></tbody></table>'
    const result = extractTable(html)
    expect(result.rows[0].cells[0].text).toBe('Čitalnica ponedeljek & torek')
  })

  test('tolerates colspan/rowspan attributes without crashing', () => {
    const html =
      '<table><tbody><tr><td colspan="2">Wide</td></tr><tr><td>A</td><td>B</td></tr></tbody></table>'
    const result = extractTable(html)
    expect(result.rows[0].cells[0].text).toBe('Wide')
    expect(result.rows).toHaveLength(2)
  })

  test('returns empty rows array for empty input', () => {
    expect(extractTable('').rows).toHaveLength(0)
    expect(extractTable('<table></table>').rows).toHaveLength(0)
  })
})

// ── splitHtmlSegments ─────────────────────────────────────────────────────────

describe('splitHtmlSegments', () => {
  test('returns single prose segment when no tables present', () => {
    const segments = splitHtmlSegments('<p>Hello</p><p>World</p>')
    expect(segments).toHaveLength(1)
    expect(segments[0].kind).toBe('prose')
    if (segments[0].kind === 'prose') expect(segments[0].html).toContain('Hello')
  })

  test('returns single table segment for table-only HTML', () => {
    const segments = splitHtmlSegments(
      '<table><tbody><tr><td>A</td></tr></tbody></table>',
    )
    expect(segments).toHaveLength(1)
    expect(segments[0].kind).toBe('table')
  })

  test('splits HTML into prose then table then prose in document order', () => {
    const segments = splitHtmlSegments(
      '<p>Before</p><table><tbody><tr><td>X</td></tr></tbody></table><p>After</p>',
    )
    expect(segments).toHaveLength(3)
    expect(segments[0].kind).toBe('prose')
    expect(segments[1].kind).toBe('table')
    expect(segments[2].kind).toBe('prose')
    if (segments[0].kind === 'prose') expect(segments[0].html).toContain('Before')
    if (segments[2].kind === 'prose') expect(segments[2].html).toContain('After')
  })

  test('handles multiple consecutive tables', () => {
    const segments = splitHtmlSegments(
      '<p>Intro</p><table><tbody><tr><td>T1</td></tr></tbody></table><table><tbody><tr><td>T2</td></tr></tbody></table>',
    )
    expect(segments).toHaveLength(3)
    expect(segments[0].kind).toBe('prose')
    expect(segments[1].kind).toBe('table')
    expect(segments[2].kind).toBe('table')
  })

  test('extracts iframe as embed segment with its src', () => {
    const segments = splitHtmlSegments(
      '<p>Before</p><iframe src="https://www.youtube.com/embed/abc"></iframe><p>After</p>',
    )
    expect(segments).toHaveLength(3)
    expect(segments[0].kind).toBe('prose')
    expect(segments[1].kind).toBe('embed')
    if (segments[1].kind === 'embed') {
      expect(segments[1].src).toBe('https://www.youtube.com/embed/abc')
    }
    expect(segments[2].kind).toBe('prose')
  })

  test('extracts multiple iframes in document order', () => {
    const html =
      '<p>A</p><iframe src="https://www.youtube.com/embed/v1"></iframe>' +
      '<p>B</p><iframe src="https://www.youtube.com/embed/v2"></iframe>'
    const segments = splitHtmlSegments(html)
    const embeds = segments.filter((s) => s.kind === 'embed')
    expect(embeds).toHaveLength(2)
    if (embeds[0].kind === 'embed') expect(embeds[0].src).toContain('v1')
    if (embeds[1].kind === 'embed') expect(embeds[1].src).toContain('v2')
  })

  test('decodes HTML entities in iframe src (&#038; → &)', () => {
    const segments = splitHtmlSegments(
      '<iframe src="https://api.mapbox.com/styles?access_token=abc&#038;fresh=true"></iframe>',
    )
    expect(segments).toHaveLength(1)
    if (segments[0].kind === 'embed') {
      expect(segments[0].src).toBe(
        'https://api.mapbox.com/styles?access_token=abc&fresh=true',
      )
    }
  })

  test('normalizes arnes host in iframe src', () => {
    const segments = splitHtmlSegments(
      '<iframe src="http://zal-lj.splet.arnes.si/embed/test"></iframe>',
    )
    if (segments[0].kind === 'embed') {
      expect(segments[0].src).toBe('https://www.zal-lj.si/embed/test')
    }
  })

  test('preserves table and iframe segments together in document order', () => {
    const segments = splitHtmlSegments(
      '<table><tr><td>T</td></tr></table><iframe src="https://example.com/e"></iframe>',
    )
    expect(segments).toHaveLength(2)
    expect(segments[0].kind).toBe('table')
    expect(segments[1].kind).toBe('embed')
  })
})
