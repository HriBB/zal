import { describe, expect, test } from 'vitest'

import { classifyEmbedUrl } from './wp-embed'

// ── classifyEmbedUrl ──────────────────────────────────────────────────────────

describe('classifyEmbedUrl', () => {
  test('classifies YouTube embed URL as youtube', () => {
    expect(
      classifyEmbedUrl('https://www.youtube.com/embed/GD2Dt1BWCHQ?feature=oembed'),
    ).toBe('youtube')
  })

  test('classifies Google Maps embed URL as googleMaps', () => {
    expect(
      classifyEmbedUrl('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3'),
    ).toBe('googleMaps')
  })

  test('classifies Google Forms URL as googleForms', () => {
    expect(
      classifyEmbedUrl(
        'https://docs.google.com/forms/d/e/1FAIpQLScZ/viewform?embedded=true',
      ),
    ).toBe('googleForms')
  })

  test('classifies Mapbox style URL as mapbox', () => {
    expect(
      classifyEmbedUrl(
        'https://api.mapbox.com/styles/v1/cookieaddict/cj1xcck8e.html?access_token=pk.abc',
      ),
    ).toBe('mapbox')
  })

  test('classifies unknown URL as unknown', () => {
    expect(classifyEmbedUrl('https://example.com/embed')).toBe('unknown')
    expect(classifyEmbedUrl('')).toBe('unknown')
  })
})
