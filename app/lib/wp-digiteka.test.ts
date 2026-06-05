import { describe, expect, it } from 'vitest'

import {
  extractMetadataPairs,
  extractCollectionFromBreadcrumb,
  isPageProject,
  wpProjectToArchiveItemDoc,
} from './wp-digiteka.ts'
import type { WpProject } from './wp-digiteka.ts'

// ── extractMetadataPairs ──────────────────────────────────────────────────────

const CHARTER_HTML = `
<div class="et_pb_text_inner"><strong>Datum in kraj:</strong> 1710, januar 11., Ljubljana<br />
<strong>Vsebina:</strong> Arhivar je pripravil izvleček.<br />
<strong>Original ali kopija:</strong> original<br />
<strong>Snov:</strong> papir<br />
<strong>Velikost v cm, št. fol.:</strong> 19,5 x 31,3<br />
<strong>Ohranjenost:</strong> dobra<br />
<strong>Pečat:</strong> pečat iz rdečega voska<br />
<strong>Objave:</strong> @ZakladnicaZgodovine (28.9.2020)</div>
`

const LETTER_HTML = `
<div class="et_pb_text_inner">
ngg_shortcode_6_placeholder
</div>
`

const WITH_FOOTER_HTML = `
<div class="et_pb_text_inner"><strong>Datum in kraj:</strong> 1600<br /></div>
<div id="kontakt">
<strong>Čitalnica</strong>: 9-12
<strong>Sprejemna pisarna</strong>: 9-13
</div>
`

describe('extractMetadataPairs', () => {
  it('extracts all 8 charter descriptors', () => {
    const pairs = extractMetadataPairs(CHARTER_HTML)
    expect(pairs).toHaveLength(8)
    expect(pairs[0]).toEqual({ label: 'Datum in kraj', value: '1710, januar 11., Ljubljana' })
    expect(pairs[1]).toEqual({ label: 'Vsebina', value: 'Arhivar je pripravil izvleček.' })
    expect(pairs[2]).toEqual({ label: 'Original ali kopija', value: 'original' })
    expect(pairs[3]).toEqual({ label: 'Snov', value: 'papir' })
    expect(pairs[4]).toEqual({ label: 'Velikost v cm, št. fol.', value: '19,5 x 31,3' })
    expect(pairs[5]).toEqual({ label: 'Ohranjenost', value: 'dobra' })
    expect(pairs[6]).toEqual({ label: 'Pečat', value: 'pečat iz rdečega voska' })
    expect(pairs[7]).toEqual({ label: 'Objave', value: '@ZakladnicaZgodovine (28.9.2020)' })
  })

  it('returns empty array for items with no label/value pairs', () => {
    expect(extractMetadataPairs(LETTER_HTML)).toEqual([])
  })

  it('cuts at id=kontakt and does not include footer strongs', () => {
    const pairs = extractMetadataPairs(WITH_FOOTER_HTML)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].label).toBe('Datum in kraj')
  })
})

// ── extractCollectionFromBreadcrumb ──────────────────────────────────────────

const KODEKSI_HTML = `
<div class="breadcrumb_path">
<div class="et_pb_text_inner"><p>
<a href="http://zal-lj.splet.arnes.si/">Domov</a> &gt;
<a href="http://zal-lj.splet.arnes.si/project/digiteka/">Digiteka</a> &gt;
<a href="http://zal-lj.splet.arnes.si/project/kodeksi/">Zapisniki mestnega sveta</a> &gt; Cod. I, knjiga 43
</p></div></div>
`

const KORESPONDENCA_HTML = `
<div class="breadcrumb_path">
<div class="et_pb_text_inner"><p>
<a href="http://zal-lj.splet.arnes.si/">Domov</a>&nbsp;&gt;&nbsp;
<a href="http://zal-lj.splet.arnes.si/project/digiteka/">Digiteka</a>&nbsp;&gt;&nbsp;
<a href="http://zal-lj.splet.arnes.si/korespondenca_terpinc/">Korespondenca Jožefine in Fidelija Terpinc 1825-1858</a>&gt; SI_ZAL_LJU-0296_š.35_ovoj II_pismo 21
</p></div></div>
`

const DIRECT_UNDER_DIGITEKA_HTML = `
<div class="breadcrumb_path">
<div class="et_pb_text_inner"><p>
<a href="http://zal-lj.splet.arnes.si/">Domov</a> &gt;
<a href="http://zal-lj.splet.arnes.si/project/digiteka/">Digiteka</a> &gt; Neka arhivalija
</p></div></div>
`

describe('extractCollectionFromBreadcrumb', () => {
  it('extracts collection from /project/ URL', () => {
    const coll = extractCollectionFromBreadcrumb(KODEKSI_HTML)
    expect(coll).toEqual({ slug: 'kodeksi', name: 'Zapisniki mestnega sveta' })
  })

  it('extracts collection from direct-path URL (non-/project/ prefix)', () => {
    const coll = extractCollectionFromBreadcrumb(KORESPONDENCA_HTML)
    expect(coll).toEqual({
      slug: 'korespondenca_terpinc',
      name: 'Korespondenca Jožefine in Fidelija Terpinc 1825-1858',
    })
  })

  it('returns null for item directly under Digiteka (no collection link)', () => {
    expect(extractCollectionFromBreadcrumb(DIRECT_UNDER_DIGITEKA_HTML)).toBeNull()
  })

  it('returns null when no breadcrumb in HTML', () => {
    expect(extractCollectionFromBreadcrumb('<p>No breadcrumb here</p>')).toBeNull()
  })
})

// ── isPageProject ─────────────────────────────────────────────────────────────

describe('isPageProject', () => {
  it('returns true for sitemap-linked slug', () => {
    expect(isPageProject('digiteka')).toBe(true)
    expect(isPageProject('listine-2')).toBe(true)
    expect(isPageProject('privilegijska-knjiga-2')).toBe(true)
  })

  it('returns false for archive item slug', () => {
    expect(isPageProject('cod-i-knjiga-43-1674')).toBe(false)
    expect(isPageProject('1710-januar-11-ljubljana')).toBe(false)
    expect(isPageProject('si_zal_lju-0296_s-35_ovoj-ii_pismo-21')).toBe(false)
  })
})

// ── wpProjectToArchiveItemDoc ─────────────────────────────────────────────────

const MOCK_PROJECT: WpProject = {
  id: 45001,
  slug: '1710-januar-11-ljubljana',
  title: { rendered: 'Listina 1710' },
  content: { rendered: CHARTER_HTML },
  link: 'https://www.zal-lj.si/project/1710-januar-11-ljubljana/',
  status: 'publish',
}

describe('wpProjectToArchiveItemDoc', () => {
  const doc = wpProjectToArchiveItemDoc(MOCK_PROJECT, 'collection.listine')

  it('produces correct _id and _type', () => {
    expect(doc._id).toBe('archiveItem.1710-januar-11-ljubljana')
    expect(doc._type).toBe('archiveItem')
  })

  it('maps title and slug', () => {
    expect(doc.title).toBe('Listina 1710')
    expect(doc.slug.current).toBe('1710-januar-11-ljubljana')
  })

  it('stores metadata pairs', () => {
    expect(doc.metadata).toHaveLength(8)
    expect(doc.metadata[0]).toMatchObject({ label: 'Datum in kraj' })
  })

  it('records _oldPath from WP link', () => {
    expect(doc._oldPath).toBe('/project/1710-januar-11-ljubljana/')
  })

  it('sets collection reference', () => {
    expect(doc.collection).toEqual({ _type: 'reference', _ref: 'collection.listine' })
  })
})
