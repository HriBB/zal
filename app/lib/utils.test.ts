import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', null, undefined, false, '', 'c')).toBe('a c')
  })

  it('lets a later Tailwind utility win over an earlier conflicting one', () => {
    // The whole point of cn over plain clsx: when a caller passes a class that
    // conflicts with a base class (same property), the last one survives so
    // component overrides via a `className` prop actually take effect.
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})
