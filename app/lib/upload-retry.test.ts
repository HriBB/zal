import { describe, expect, it, vi } from 'vitest'
import { withRetry } from './upload-retry'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries after failure, succeeds on next attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws last error after all attempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('permanent'))
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })).rejects.toThrow('permanent')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('uses default options when none provided', async () => {
    const fn = vi.fn().mockResolvedValue(42)
    expect(await withRetry(fn)).toBe(42)
  })
})
