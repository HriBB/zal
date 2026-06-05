import { describe, expect, test } from 'vitest'

import { extractInlineGallery, nggNth } from './wp-gallery'

// ── extractInlineGallery ───────────────────────────────────────────────────────

describe('extractInlineGallery', () => {
  test('extracts full-size href from et_pb_gallery_item anchor', () => {
    const html = `<div class="et_pb_gallery_item et_pb_grid_item">
      <a href="https://www.zal-lj.si/files/img.jpg" title="Title">
        <img src="https://www.zal-lj.si/files/img-400x284.jpg" alt="Some alt">
      </a></div>`
    const images = extractInlineGallery(html)
    expect(images).toHaveLength(1)
    expect(images[0].url).toBe('https://www.zal-lj.si/files/img.jpg')
  })

  test('thumbnail suffix not present in extracted URL (uses href not src)', () => {
    const html = `<div class="et_pb_gallery_item">
      <a href="https://www.zal-lj.si/files/Slika-7.jpg">
        <img src="https://www.zal-lj.si/files/Slika-7-400x284.jpg" alt="">
      </a></div>`
    const images = extractInlineGallery(html)
    expect(images[0].url).not.toMatch(/-\d+x\d+\./)
    expect(images[0].url).toBe('https://www.zal-lj.si/files/Slika-7.jpg')
  })

  test('uses img alt as alt text', () => {
    const html = `<div class="et_pb_gallery_item">
      <a href="https://x.com/img.jpg" title="Caption">
        <img src="..." alt="My alt text">
      </a></div>`
    const images = extractInlineGallery(html)
    expect(images[0].alt).toBe('My alt text')
  })

  test('falls back to anchor title when img alt is empty', () => {
    const html = `<div class="et_pb_gallery_item">
      <a href="https://x.com/img.jpg" title="Razglednica Ljubljane, 1912">
        <img src="..." alt="">
      </a></div>`
    const images = extractInlineGallery(html)
    expect(images[0].alt).toBe('Razglednica Ljubljane, 1912')
  })

  test('stores anchor title as caption when present', () => {
    const html = `<div class="et_pb_gallery_item">
      <a href="https://x.com/img.jpg" title="Razglednica, 1912">
        <img src="..." alt="Photo">
      </a></div>`
    const images = extractInlineGallery(html)
    expect(images[0].caption).toBe('Razglednica, 1912')
  })

  test('preserves document order', () => {
    const html = `
      <div class="et_pb_gallery_item"><a href="https://x.com/img1.jpg"><img alt="1" src=""></a></div>
      <div class="et_pb_gallery_item"><a href="https://x.com/img2.jpg"><img alt="2" src=""></a></div>
      <div class="et_pb_gallery_item"><a href="https://x.com/img3.jpg"><img alt="3" src=""></a></div>
    `
    const images = extractInlineGallery(html)
    expect(images).toHaveLength(3)
    expect(images[0].url).toContain('img1')
    expect(images[1].url).toContain('img2')
    expect(images[2].url).toContain('img3')
  })

  test('returns empty array when no et_pb_gallery_item anchors', () => {
    const images = extractInlineGallery('<p>No gallery here</p>')
    expect(images).toHaveLength(0)
  })

  test('normalises arnes host to www', () => {
    const html = `<div class="et_pb_gallery_item">
      <a href="http://zal-lj.splet.arnes.si/files/img.jpg">
        <img src="" alt="x">
      </a></div>`
    const images = extractInlineGallery(html)
    expect(images[0].url).toBe('https://www.zal-lj.si/files/img.jpg')
  })
})

// ── nggNth ────────────────────────────────────────────────────────────────────

describe('nggNth', () => {
  test('extracts 0 from ngg_shortcode_0_placeholder', () => {
    expect(nggNth('ngg_shortcode_0_placeholder')).toBe(0)
  })

  test('extracts larger index from ngg_shortcode_N_placeholder', () => {
    expect(nggNth('ngg_shortcode_3_placeholder')).toBe(3)
  })

  test('finds placeholder inline in surrounding text', () => {
    expect(nggNth('Some text ngg_shortcode_1_placeholder more text')).toBe(1)
  })

  test('returns null when no ngg placeholder present', () => {
    expect(nggNth('<p>No gallery here</p>')).toBeNull()
  })

  test('returns null for empty string', () => {
    expect(nggNth('')).toBeNull()
  })
})
