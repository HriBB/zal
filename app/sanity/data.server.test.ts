import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defineSanityQuery } from './data'
import { loadSanity } from './data.server'

const loadQuery = vi.fn()
const loadQueryOptions = vi.fn()

vi.mock('~/sanity/loader.server', () => ({ loadQuery: (...a: unknown[]) => loadQuery(...a) }))
vi.mock('~/sanity/loadQueryOptions.server', () => ({
  loadQueryOptions: (...a: unknown[]) => loadQueryOptions(...a),
}))

const req = () => new Request('https://www.zal-lj.si/')
const descriptor = defineSanityQuery<{ title: string }, { slug: string }>('*[_type=="page"][0]')

beforeEach(() => {
  vi.clearAllMocks()
  loadQueryOptions.mockResolvedValue({
    preview: false,
    options: { perspective: 'published' },
  })
})

describe('loadSanity', () => {
  it('forwards descriptor query, params and options to loadQuery', async () => {
    loadQuery.mockResolvedValue({ data: { title: 'Domov' } })
    const result = await loadSanity(req(), descriptor, { params: { slug: 'domov' } })
    expect(loadQuery).toHaveBeenCalledWith(descriptor.query, { slug: 'domov' }, {
      perspective: 'published',
    })
    expect(result).toEqual({ initial: { data: { title: 'Domov' } }, params: { slug: 'domov' } })
  })

  it('defaults params to {} when none given', async () => {
    loadQuery.mockResolvedValue({ data: { title: 'Domov' } })
    const result = await loadSanity(req(), descriptor)
    expect(loadQuery).toHaveBeenCalledWith(descriptor.query, {}, expect.anything())
    expect(result.params).toEqual({})
  })

  it('throws 404 when notFoundIfEmpty and document missing', async () => {
    loadQuery.mockResolvedValue({ data: null })
    await expect(
      loadSanity(req(), descriptor, { notFoundIfEmpty: true }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('does not throw when notFoundIfEmpty and document exists', async () => {
    loadQuery.mockResolvedValue({ data: { title: 'Domov' } })
    await expect(
      loadSanity(req(), descriptor, { notFoundIfEmpty: true }),
    ).resolves.toMatchObject({ initial: { data: { title: 'Domov' } } })
  })

  it('includes preview flag only when withPreview is set', async () => {
    loadQuery.mockResolvedValue({ data: { title: 'X' } })
    loadQueryOptions.mockResolvedValue({ preview: true, options: { perspective: 'drafts' } })

    const withFlag = await loadSanity(req(), descriptor, { withPreview: true })
    expect(withFlag).toMatchObject({ preview: true })

    const without = await loadSanity(req(), descriptor)
    expect(without).not.toHaveProperty('preview')
  })
})
