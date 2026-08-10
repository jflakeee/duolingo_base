import { describe, it, expect, vi, afterEach } from 'vitest'
import { buzzCorrect, buzzWrong } from '../src/audio/haptics.js'

afterEach(() => { delete navigator.vibrate })

describe('haptics (guarded)', () => {
  it('does not throw when navigator.vibrate is missing', () => {
    expect(() => buzzCorrect()).not.toThrow()
    expect(() => buzzWrong()).not.toThrow()
  })
  it('calls navigator.vibrate when available', () => {
    const spy = vi.fn()
    navigator.vibrate = spy
    buzzCorrect()
    buzzWrong()
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
