import { describe, it, expect } from 'vitest'
import { formatBuildTime } from '../src/buildInfo.js'

describe('formatBuildTime', () => {
  it('formats an ISO time in Korea time (UTC+9)', () => {
    // 11:45 UTC → 20:45 KST, same calendar day
    const s = formatBuildTime('2026-08-12T11:45:00Z')
    expect(s).toContain('2026')
    expect(s).toContain('20:45')
  })
  it('rolls over to the next KST day for late-UTC times', () => {
    // 18:00 UTC on the 12th → 03:00 KST on the 13th
    const s = formatBuildTime('2026-08-12T18:00:00Z')
    expect(s).toContain('13')
    expect(s).toContain('03:00')
  })
  it('returns empty string for missing or invalid input', () => {
    expect(formatBuildTime(null)).toBe('')
    expect(formatBuildTime('not-a-date')).toBe('')
  })
})
