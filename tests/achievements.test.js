import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, newlyUnlocked } from '../src/engine/achievements.js'

const base = {
  xp: 0, streak: { count: 0 }, completedLessons: [], perfectCount: 0, achievements: {},
}

describe('achievements', () => {
  it('exposes a non-empty list', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(4)
  })
  it('unlocks first lesson', () => {
    const p = { ...base, completedLessons: ['a'] }
    expect(newlyUnlocked(p)).toContain('first')
  })
  it('unlocks streak7 and xp500', () => {
    const p = { ...base, streak: { count: 7 }, xp: 500, completedLessons: ['a'] }
    const ids = newlyUnlocked(p)
    expect(ids).toContain('streak7')
    expect(ids).toContain('xp500')
  })
  it('does not re-unlock already-earned achievements', () => {
    const p = { ...base, completedLessons: ['a'], achievements: { first: '2026-08-01' } }
    expect(newlyUnlocked(p)).not.toContain('first')
  })
  it('returns nothing for a fresh profile', () => {
    expect(newlyUnlocked(base)).toEqual([])
  })
})
