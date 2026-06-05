import { describe, expect, test } from 'vitest'

import { cleanSlugForPage, wpPageToPageDoc } from './wp-page'
import type { EmbedPageBlock, GalleryPageBlock, RichTextPageBlock, TablePageBlock } from './wp-page'

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
    const block = doc.blocks[0] as RichTextPageBlock
    expect(block.body.length).toBeGreaterThan(0)
  })

  test('empty content produces a richTextBlock with empty body', () => {
    const page = { ...mockWpPage, content: { rendered: '' } }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    const block = doc.blocks[0] as RichTextPageBlock
    expect(block.body).toHaveLength(0)
  })
})

// ── wpPageToPageDoc – table blocks ─────────────────────────────────────────────

describe('wpPageToPageDoc – table blocks', () => {
  test('page with single table produces a tableBlock', () => {
    const page = {
      ...mockWpPage,
      content: {
        rendered:
          '<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>',
      },
    }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    const tableBlocks = doc.blocks.filter((b) => b._type === 'tableBlock')
    expect(tableBlocks).toHaveLength(1)
  })

  test('page with prose + table produces richTextBlock then tableBlock in order', () => {
    const page = {
      ...mockWpPage,
      content: {
        rendered:
          '<p>Intro</p><table><tbody><tr><td>A</td></tr></tbody></table>',
      },
    }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    expect(doc.blocks).toHaveLength(2)
    expect(doc.blocks[0]._type).toBe('richTextBlock')
    expect(doc.blocks[1]._type).toBe('tableBlock')
  })

  test('tableBlock contains correct rows from the HTML table', () => {
    const page = {
      ...mockWpPage,
      content: {
        rendered:
          '<table><tbody><tr><td>Naslov</td><td>Vrednost</td></tr></tbody></table>',
      },
    }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    const tb = doc.blocks[0] as TablePageBlock
    expect(tb.rows).toHaveLength(1)
    expect(tb.rows[0].cells[0].text).toBe('Naslov')
  })
})

// ── wpPageToPageDoc – embed blocks ─────────────────────────────────────────────

describe('wpPageToPageDoc – embed blocks', () => {
  test('page with single iframe produces an embedBlock', () => {
    const page = {
      ...mockWpPage,
      content: {
        rendered:
          '<p>Video:</p><iframe src="https://www.youtube.com/embed/abc123"></iframe>',
      },
    }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    const embeds = doc.blocks.filter((b) => b._type === 'embedBlock')
    expect(embeds).toHaveLength(1)
    const eb = embeds[0] as EmbedPageBlock
    expect(eb.url).toBe('https://www.youtube.com/embed/abc123')
  })

  test('multiple iframes produce multiple embedBlocks in document order', () => {
    const page = {
      ...mockWpPage,
      content: {
        rendered:
          '<iframe src="https://www.youtube.com/embed/v1"></iframe>' +
          '<iframe src="https://www.youtube.com/embed/v2"></iframe>',
      },
    }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    const embeds = doc.blocks.filter((b) => b._type === 'embedBlock') as EmbedPageBlock[]
    expect(embeds).toHaveLength(2)
    expect(embeds[0].url).toContain('v1')
    expect(embeds[1].url).toContain('v2')
  })

  test('embedBlock url has HTML entities decoded', () => {
    const page = {
      ...mockWpPage,
      content: {
        rendered:
          '<iframe src="https://api.mapbox.com/styles?token=abc&#038;fresh=true"></iframe>',
      },
    }
    const doc = wpPageToPageDoc(page, 'kontakti', null)
    const eb = doc.blocks[0] as EmbedPageBlock
    expect(eb.url).toBe('https://api.mapbox.com/styles?token=abc&fresh=true')
  })
})

// ── wpPageToPageDoc – gallery blocks ──────────────────────────────────────────

const GALLERY_ITEM_HTML =
  '<div class="et_pb_gallery_item"><a href="https://x.com/img.jpg"><img alt="Slika" src=""></a></div>'

describe('wpPageToPageDoc – gallery blocks', () => {
  test('et_pb_gallery_item HTML produces a galleryBlock', () => {
    const page = { ...mockWpPage, content: { rendered: GALLERY_ITEM_HTML } }
    const doc = wpPageToPageDoc(page, 'galerija', null)
    const gb = doc.blocks.filter((b) => b._type === 'galleryBlock')
    expect(gb).toHaveLength(1)
  })

  test('galleryBlock figures contain the image URL', () => {
    const page = { ...mockWpPage, content: { rendered: GALLERY_ITEM_HTML } }
    const doc = wpPageToPageDoc(page, 'galerija', null)
    const gb = doc.blocks.find((b) => b._type === 'galleryBlock') as GalleryPageBlock
    expect(gb.figures).toHaveLength(1)
    expect(gb.figures[0].url).toBe('https://x.com/img.jpg')
  })

  test('ngg_shortcode_0_placeholder resolved via galleries fixture', () => {
    const galleries = {
      'my-page': {
        scans: [
          { sourceUrl: 'https://x.com/scan1.jpg', localPath: 'scans/my-page/scan1.jpg' },
        ],
      },
    }
    const page = { ...mockWpPage, content: { rendered: 'ngg_shortcode_0_placeholder' } }
    const doc = wpPageToPageDoc(page, 'my-page', null, galleries)
    const gb = doc.blocks.find((b) => b._type === 'galleryBlock') as GalleryPageBlock
    expect(gb).toBeDefined()
    expect(gb.figures).toHaveLength(1)
    expect(gb.figures[0].url).toBe('https://x.com/scan1.jpg')
  })

  test('document order preserved: prose before gallery', () => {
    const page = {
      ...mockWpPage,
      content: { rendered: '<p>Intro</p>' + GALLERY_ITEM_HTML },
    }
    const doc = wpPageToPageDoc(page, 'galerija', null)
    expect(doc.blocks.length).toBeGreaterThanOrEqual(2)
    expect(doc.blocks[0]._type).toBe('richTextBlock')
    expect(doc.blocks[doc.blocks.length - 1]._type).toBe('galleryBlock')
  })
})
