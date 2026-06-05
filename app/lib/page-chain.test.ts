import { describe, expect, test } from 'vitest'

import { matchesChain } from './page-chain'

describe('matchesChain', () => {
  test('matches a single root-level page (no parent)', () => {
    const page = {
      slug: 'o-arhivu',
      parentSlug: null,
      grandParentSlug: null,
      greatGrandParentSlug: null,
    }
    expect(matchesChain(page, ['o-arhivu'])).toBe(true)
  })

  test('matches a two-level chain', () => {
    const page = {
      slug: 'kontakti',
      parentSlug: 'o-arhivu',
      grandParentSlug: null,
      greatGrandParentSlug: null,
    }
    expect(matchesChain(page, ['o-arhivu', 'kontakti'])).toBe(true)
  })

  test('matches a three-level chain', () => {
    const page = {
      slug: 'enota-v-ljubljani',
      parentSlug: 'predstavitev',
      grandParentSlug: 'o-arhivu',
      greatGrandParentSlug: null,
    }
    expect(matchesChain(page, ['o-arhivu', 'predstavitev', 'enota-v-ljubljani'])).toBe(true)
  })

  test('rejects wrong parent slug (wrong-chain 404)', () => {
    const page = {
      slug: 'kontakti',
      parentSlug: 'o-arhivu',
      grandParentSlug: null,
      greatGrandParentSlug: null,
    }
    expect(matchesChain(page, ['za-uporabnike', 'kontakti'])).toBe(false)
  })

  test('rejects URL too shallow for a nested page', () => {
    const page = {
      slug: 'kontakti',
      parentSlug: 'o-arhivu',
      grandParentSlug: null,
      greatGrandParentSlug: null,
    }
    // Only 1 segment but page needs 2
    expect(matchesChain(page, ['kontakti'])).toBe(false)
  })

  test('rejects URL too deep for the page chain', () => {
    const page = {
      slug: 'kontakti',
      parentSlug: 'o-arhivu',
      grandParentSlug: null,
      greatGrandParentSlug: null,
    }
    // URL has an extra phantom segment
    expect(matchesChain(page, ['o-arhivu', 'extra', 'kontakti'])).toBe(false)
  })

  test('correctly handles root-level page given wrong URL with parent segment', () => {
    const page = {
      slug: 'o-arhivu',
      parentSlug: null,
      grandParentSlug: null,
      greatGrandParentSlug: null,
    }
    expect(matchesChain(page, ['anything', 'o-arhivu'])).toBe(false)
  })
})
