import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadQueryOptions } from './loadQueryOptions.server'

const sessionGet = vi.fn()
vi.mock('~/lib/session.server', () => ({
  getSession: () => Promise.resolve({ get: (k: string) => sessionGet(k) }),
}))
vi.mock('~/sanity/client', () => ({
  client: { config: () => ({ projectId: 'proj-1' }) },
}))

const headers = () => new Headers({ Cookie: '__preview=whatever' })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SANITY_READ_TOKEN', 'tok')
})
afterEach(() => vi.unstubAllEnvs())

describe('loadQueryOptions', () => {
  it('serves published content with no stega when not in preview', async () => {
    sessionGet.mockReturnValue(undefined)
    const { preview, options } = await loadQueryOptions(headers())
    expect(preview).toBe(false)
    expect(options).toEqual({ perspective: 'published', stega: undefined })
  })

  it('serves drafts with stega when cookie projectId matches', async () => {
    sessionGet.mockReturnValue('proj-1')
    const { preview, options } = await loadQueryOptions(headers())
    expect(preview).toBe(true)
    expect(options).toEqual({
      perspective: 'drafts',
      stega: { enabled: true, studioUrl: '/studio' },
    })
  })

  it('refuses to enter preview without SANITY_READ_TOKEN', async () => {
    sessionGet.mockReturnValue('proj-1')
    vi.stubEnv('SANITY_READ_TOKEN', '')
    await expect(loadQueryOptions(headers())).rejects.toThrow(/SANITY_READ_TOKEN/)
  })
})
