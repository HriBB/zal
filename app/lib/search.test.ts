import { describe, expect, it } from 'vitest'

import {
  sanitizeTerm,
  isValidTerm,
  buildSearchParams,
  totalHits,
  type SearchResults,
} from './search.ts'

// ── sanitizeTerm ──────────────────────────────────────────────────────────────

describe('sanitizeTerm', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitizeTerm('  listina  ')).toBe('listina')
  })

  it('collapses internal whitespace', () => {
    expect(sanitizeTerm('listina  iz   kranja')).toBe('listina iz kranja')
  })

  it('returns empty string for blank input', () => {
    expect(sanitizeTerm('   ')).toBe('')
  })

  it('returns term unchanged when already clean', () => {
    expect(sanitizeTerm('zgodovina')).toBe('zgodovina')
  })
})

// ── isValidTerm ───────────────────────────────────────────────────────────────

describe('isValidTerm', () => {
  it('returns false for empty string', () => {
    expect(isValidTerm('')).toBe(false)
  })

  it('returns false for single character', () => {
    expect(isValidTerm('a')).toBe(false)
  })

  it('returns true for two characters', () => {
    expect(isValidTerm('ab')).toBe(true)
  })

  it('returns true for longer term', () => {
    expect(isValidTerm('zgodovina')).toBe(true)
  })
})

// ── buildSearchParams ─────────────────────────────────────────────────────────

describe('buildSearchParams', () => {
  it('sanitizes and appends wildcard for prefix matching', () => {
    expect(buildSearchParams('  listina  ')).toEqual({ term: 'listina*' })
  })

  it('collapses whitespace then appends wildcard', () => {
    expect(buildSearchParams('arhiv  ljubljana')).toEqual({ term: 'arhiv ljubljana*' })
  })
})

// ── totalHits ─────────────────────────────────────────────────────────────────

describe('totalHits', () => {
  const empty: SearchResults = { pages: [], posts: [], collections: [], archiveItems: [] }

  it('returns 0 for all-empty groups', () => {
    expect(totalHits(empty)).toBe(0)
  })

  it('sums all group lengths', () => {
    const results: SearchResults = {
      pages: [{ _id: 'p1', title: 'A', slug: 'a', parentSlug: null }],
      posts: [{ _id: 'q1', title: 'B', slug: 'b', date: '2024-01-01' }, { _id: 'q2', title: 'C', slug: 'c', date: '2024-01-02' }],
      collections: [],
      archiveItems: [{ _id: 'r1', title: 'D', slug: 'd', collectionSlug: 'listine' }],
    }
    expect(totalHits(results)).toBe(4)
  })
})

// ── runSearch (seam) ──────────────────────────────────────────────────────────

describe('runSearch (seam)', () => {
  it('calls runner with sanitized wildcard params and returns results', async () => {
    // Import here to avoid hoisting issues with mocks.
    const { runSearch } = await import('./search.ts')

    const fakeResults: SearchResults = {
      pages: [{ _id: 'p1', title: 'Listine', slug: 'listine', parentSlug: null }],
      posts: [],
      collections: [],
      archiveItems: [],
    }
    let capturedParams: { term: string } | undefined
    const runner = async (params: { term: string }) => {
      capturedParams = params
      return fakeResults
    }

    const result = await runSearch('  listina  ', runner)

    expect(capturedParams).toEqual({ term: 'listina*' })
    expect(result).toBe(fakeResults)
  })
})
