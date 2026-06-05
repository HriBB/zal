import { describe, expect, it } from 'vitest'

import {
  breadcrumbToCollection,
  extractBreadcrumb,
  extractGalleryUrls,
  normalizeHost,
  scanLocalPath,
} from './scrape-gallery'

// A trimmed slice of a live NextGEN `/project/` gallery: each scan is an <a> whose
// href is the full-resolution original under /wp-content/blogs.dir/<id>/files/<slug>/,
// wrapping an <img> that points at the derived /thumbs/thumbs_* variant. The page
// also carries the site logo as an image-href anchor in the chrome.
const NGG_HTML = `
<a href="http://zal-lj.splet.arnes.si/files/2016/09/Logo_prosojen.png"><img src="http://zal-lj.splet.arnes.si/files/2016/09/Logo_prosojen.png"></a>
<div class="ngg-galleryoverview">
  <div class="ngg-gallery-thumbnail">
    <a href="https://www.zal-lj.si/wp-content/blogs.dir/4271/files/cod/SI_001.jpg" data-src="x">
      <img src="https://www.zal-lj.si/wp-content/blogs.dir/4271/files/cod/thumbs/thumbs_SI_001.jpg">
    </a>
  </div>
  <div class="ngg-gallery-thumbnail">
    <a href="https://www.zal-lj.si/wp-content/blogs.dir/4271/files/cod/SI_002.jpg">
      <img src="https://www.zal-lj.si/wp-content/blogs.dir/4271/files/cod/thumbs/thumbs_SI_002.jpg">
    </a>
  </div>
</div>`

// The live WordPress bakes both the canonical host (www.zal-lj.si) and the legacy
// Arnes host (zal-lj.splet.arnes.si, sometimes over http) into the same page. Every
// URL we record must collapse to the canonical https host (ADR 0003, migration
// landmine: normalize host zal-lj.splet.arnes.si → www.zal-lj.si).
describe('normalizeHost', () => {
  it('rewrites the legacy Arnes host to the canonical https host', () => {
    expect(normalizeHost('http://zal-lj.splet.arnes.si/files/2016/09/Logo.png')).toBe(
      'https://www.zal-lj.si/files/2016/09/Logo.png',
    )
  })
})

describe('extractGalleryUrls', () => {
  it('returns the full-resolution scan originals, never the thumbs_ variants', () => {
    expect(extractGalleryUrls(NGG_HTML)).toEqual([
      'https://www.zal-lj.si/wp-content/blogs.dir/4271/files/cod/SI_001.jpg',
      'https://www.zal-lj.si/wp-content/blogs.dir/4271/files/cod/SI_002.jpg',
    ])
  })

  it('skips the logo and other chrome that is an image-href anchor', () => {
    expect(extractGalleryUrls(NGG_HTML)).not.toContain(
      'https://www.zal-lj.si/files/2016/09/Logo_prosojen.png',
    )
  })

  // The /galerija/ page is a Divi et_pb_gallery, not NextGEN: the href is already the
  // original out of /files/, and any WP resize suffix on a href collapses to the
  // original (migration landmine: strip -300x200 suffixes).
  it('reads Divi gallery originals from /files/ and strips WP resize suffixes', () => {
    const divi = `
      <a href="https://www.zal-lj.si/files/2015/02/Slika-7.jpg"><img src="https://www.zal-lj.si/files/2015/02/Slika-7-400x284.jpg"></a>
      <a href="https://www.zal-lj.si/files/2015/02/Slika-8-1024x768.jpg"><img src="x"></a>`
    expect(extractGalleryUrls(divi)).toEqual([
      'https://www.zal-lj.si/files/2015/02/Slika-7.jpg',
      'https://www.zal-lj.si/files/2015/02/Slika-8.jpg',
    ])
  })

  it('de-duplicates repeated scans, keeping document order', () => {
    const dup = `
      <a href="https://www.zal-lj.si/files/x/b.jpg"><img src="t"></a>
      <a href="https://www.zal-lj.si/files/x/a.jpg"><img src="t"></a>
      <a href="https://www.zal-lj.si/files/x/b.jpg"><img src="t"></a>`
    expect(extractGalleryUrls(dup)).toEqual([
      'https://www.zal-lj.si/files/x/b.jpg',
      'https://www.zal-lj.si/files/x/a.jpg',
    ])
  })
})

// The Divi `breadcrumb_path` module on a /project/ page: a run of <a> links joined by
// "&gt;", ending in a non-link text node for the current item. The collection is the
// link between "Digiteka" and the current item — Domov > Digiteka > <collection> > <item>.
const BREADCRUMB_HTML = `
<div class="et_pb_text breadcrumb_path">
  <div class="et_pb_text_inner"><p>
    <a title="Domača stran" href="http://zal-lj.splet.arnes.si/">Domov</a>&nbsp;&gt;&nbsp;<a title="Digiteka" href="http://zal-lj.splet.arnes.si/project/digiteka/">Digiteka</a>&nbsp;&gt;&nbsp;<a href="http://zal-lj.splet.arnes.si/project/kodeksi/">Zapisniki ljubljanskega mestnega sveta, 1521&#8211;1671</a>&gt; Cod. I, knjiga 43 (1674)
  </p></div>
</div>`

describe('extractBreadcrumb', () => {
  it('reads the ordered crumbs, ending in the current item as a hrefless node', () => {
    expect(extractBreadcrumb(BREADCRUMB_HTML)).toEqual([
      { text: 'Domov', href: 'https://www.zal-lj.si/' },
      { text: 'Digiteka', href: 'https://www.zal-lj.si/project/digiteka/' },
      {
        text: 'Zapisniki ljubljanskega mestnega sveta, 1521–1671',
        href: 'https://www.zal-lj.si/project/kodeksi/',
      },
      { text: 'Cod. I, knjiga 43 (1674)', href: null },
    ])
  })

  it('returns an empty list when the page has no breadcrumb', () => {
    expect(extractBreadcrumb('<div>no crumbs here</div>')).toEqual([])
  })
})

describe('breadcrumbToCollection', () => {
  it('derives the collection from the link between Digiteka and the item', () => {
    expect(breadcrumbToCollection(extractBreadcrumb(BREADCRUMB_HTML))).toEqual({
      name: 'Zapisniki ljubljanskega mestnega sveta, 1521–1671',
      slug: 'kodeksi',
    })
  })

  it('returns null for an item directly under Digiteka (no collection)', () => {
    const crumbs = [
      { text: 'Domov', href: 'https://www.zal-lj.si/' },
      { text: 'Digiteka', href: 'https://www.zal-lj.si/project/digiteka/' },
      { text: 'Neki dokument', href: null },
    ]
    expect(breadcrumbToCollection(crumbs)).toBeNull()
  })

  it('returns null when there is no breadcrumb at all', () => {
    expect(breadcrumbToCollection([])).toBeNull()
  })
})

describe('scanLocalPath', () => {
  it('files each scan under scans/<slug>/<filename>, relative to the download root', () => {
    expect(
      scanLocalPath(
        'cod-i-knjiga-43-1674',
        'https://www.zal-lj.si/wp-content/blogs.dir/4271/files/cod-i-knjiga-43-1674/SI_001.jpg',
      ),
    ).toBe('scans/cod-i-knjiga-43-1674/SI_001.jpg')
  })

  it('decodes percent-encoded filenames so the path is a real on-disk name', () => {
    expect(scanLocalPath('x', 'https://www.zal-lj.si/files/2015/02/Slika%20-%207.jpg')).toBe(
      'scans/x/Slika - 7.jpg',
    )
  })
})
