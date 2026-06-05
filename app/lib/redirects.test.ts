import { describe, expect, test } from 'vitest'

import { buildPagePath, normalizeOldPath } from './redirects'

describe('normalizeOldPath', () => {
  test('strips trailing slash', () => {
    expect(normalizeOldPath('/domaca-stran-1/o-arhivu-2/')).toBe('/domaca-stran-1/o-arhivu-2')
  })

  test('strips host when full URL given', () => {
    expect(normalizeOldPath('https://www.zal-lj.si/domaca-stran-1/')).toBe('/domaca-stran-1')
  })

  test('leaves already-normalised path unchanged', () => {
    expect(normalizeOldPath('/novice')).toBe('/novice')
  })

  test('root slash preserved as-is', () => {
    expect(normalizeOldPath('/')).toBe('/')
  })

  test('strips arnes host', () => {
    expect(normalizeOldPath('https://zal-lj.splet.arnes.si/project/slug/')).toBe('/project/slug')
  })
})

describe('buildPagePath', () => {
  test('single segment', () => {
    expect(buildPagePath([null, null, null, 'kontakti'])).toBe('/kontakti')
  })

  test('two segments (parent + child)', () => {
    expect(buildPagePath([null, null, 'o-arhivu', 'kontakti'])).toBe('/o-arhivu/kontakti')
  })

  test('three segments', () => {
    expect(buildPagePath([null, 'o-arhivu', 'predstavitev', 'enota-v-ljubljani'])).toBe(
      '/o-arhivu/predstavitev/enota-v-ljubljani',
    )
  })

  test('four segments', () => {
    expect(buildPagePath(['a', 'b', 'c', 'd'])).toBe('/a/b/c/d')
  })

  test('filters null and undefined', () => {
    expect(buildPagePath([undefined, null, 'parent', 'child'])).toBe('/parent/child')
  })
})
