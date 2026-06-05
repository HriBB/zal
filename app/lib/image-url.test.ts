import { describe, it, expect } from 'vitest'
import { sanityImageUrl } from './image-url'

const BASE = 'https://cdn.sanity.io/images/abc/prod/photo.jpg'

describe('sanityImageUrl', () => {
  it('returns null for null input', () => {
    expect(sanityImageUrl(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(sanityImageUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(sanityImageUrl('')).toBeNull()
  })

  it('appends w param', () => {
    const result = sanityImageUrl(BASE, { w: 800 })
    expect(result).toBe(`${BASE}?w=800`)
  })

  it('appends auto=format param', () => {
    const result = sanityImageUrl(BASE, { auto: 'format' })
    expect(result).toBe(`${BASE}?auto=format`)
  })

  it('appends q param', () => {
    const result = sanityImageUrl(BASE, { q: 80 })
    expect(result).toBe(`${BASE}?q=80`)
  })

  it('appends all params combined', () => {
    const result = sanityImageUrl(BASE, { w: 1920, auto: 'format', q: 80 })
    const u = new URL(result!)
    expect(u.searchParams.get('w')).toBe('1920')
    expect(u.searchParams.get('auto')).toBe('format')
    expect(u.searchParams.get('q')).toBe('80')
  })

  it('appends h and fit params', () => {
    const result = sanityImageUrl(BASE, { h: 400, fit: 'crop' })
    const u = new URL(result!)
    expect(u.searchParams.get('h')).toBe('400')
    expect(u.searchParams.get('fit')).toBe('crop')
  })

  it('merges with existing query params on url', () => {
    const withParam = `${BASE}?origin=cms`
    const result = sanityImageUrl(withParam, { w: 400 })
    const u = new URL(result!)
    expect(u.searchParams.get('origin')).toBe('cms')
    expect(u.searchParams.get('w')).toBe('400')
  })

  it('returns original url when called with no opts', () => {
    expect(sanityImageUrl(BASE)).toBe(BASE)
  })
})
