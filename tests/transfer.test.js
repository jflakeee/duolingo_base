import { describe, it, expect } from 'vitest'
import { encodeProgress, decodeProgress } from '../src/engine/transfer.js'

const LESSONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] // 10 lessons

const sample = {
  memberId: 'LD-ABCD-2345',
  xp: 340,
  gems: 25,
  dailyGoal: 20,
  role: 'parent',
  streak: { count: 7, lastDay: '2026-08-12', freezes: 1 },
  completedLessons: ['a', 'c', 'j'],
}

describe('encode/decode round-trip', () => {
  it('restores core stats and completed lessons', () => {
    const code = encodeProgress(sample, LESSONS)
    expect(code.startsWith('LDX1:')).toBe(true)
    const out = decodeProgress(code, LESSONS)
    expect(out.memberId).toBe('LD-ABCD-2345')
    expect(out.xp).toBe(340)
    expect(out.gems).toBe(25)
    expect(out.dailyGoal).toBe(20)
    expect(out.role).toBe('parent')
    expect(out.streakCount).toBe(7)
    expect(out.completedLessons).toEqual(['a', 'c', 'j'])
  })
  it('handles an empty completed set', () => {
    const code = encodeProgress({ ...sample, completedLessons: [] }, LESSONS)
    expect(decodeProgress(code, LESSONS).completedLessons).toEqual([])
  })
})

describe('decode validation', () => {
  it('rejects a non-string', () => {
    expect(decodeProgress(null, LESSONS)).toBeNull()
  })
  it('rejects a wrong prefix', () => {
    expect(decodeProgress('nope', LESSONS)).toBeNull()
  })
  it('rejects corrupt payload', () => {
    expect(decodeProgress('LDX1:@@@notb64@@@', LESSONS)).toBeNull()
  })
})
