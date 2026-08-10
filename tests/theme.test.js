import { describe, it, expect } from 'vitest'
import { resolveTheme } from '../src/engine/theme.js'

describe('resolveTheme', () => {
  it('explicit dark/light win', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })
  it('auto follows the OS preference', () => {
    expect(resolveTheme('auto', true)).toBe('dark')
    expect(resolveTheme('auto', false)).toBe('light')
  })
})
