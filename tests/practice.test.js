import { describe, it, expect } from 'vitest'
import { dailySeed, mulberry32, shuffleSeeded, levelExercises, varyChoices, buildDailyPractice } from '../src/engine/practice.js'

const level = {
  id: 'L', units: [
    { lessons: [
      { exercises: [
        { type: 'mcq', prompt: 'a', choices: ['a', 'b', 'c', 'd'], answer: 'a' },
        { type: 'mcq', prompt: 'b', choices: ['b', 'c', 'd', 'e'], answer: 'b' },
        { type: 'match', prompt: 'm', pairs: [['x', '엑스']] },
      ] },
      { exercises: [
        { type: 'wordbank', prompt: 'w', tokens: ['I', 'go'], answer: ['I', 'go'] },
        { type: 'mcq', prompt: 'c', choices: ['c', 'd', 'e', 'f'], answer: 'c' },
      ] },
    ] },
  ],
}

describe('seed + prng', () => {
  it('dailySeed is deterministic and salt-sensitive', () => {
    expect(dailySeed('2026-08-13')).toBe(dailySeed('2026-08-13'))
    expect(dailySeed('2026-08-13', 'L')).not.toBe(dailySeed('2026-08-14', 'L'))
  })
  it('mulberry32 yields values in [0,1) and is deterministic', () => {
    const a = mulberry32(123), b = mulberry32(123)
    for (let i = 0; i < 5; i++) {
      const v = a()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      expect(v).toBe(b())
    }
  })
  it('shuffleSeeded is deterministic per seed and does not mutate', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(shuffleSeeded(arr, mulberry32(7))).toEqual(shuffleSeeded(arr, mulberry32(7)))
    expect(arr).toEqual([1, 2, 3, 4, 5])
  })
})

describe('levelExercises + varyChoices', () => {
  it('flattens all exercises in a level', () => {
    expect(levelExercises(level)).toHaveLength(5)
  })
  it('shuffles mcq choices but keeps the same set (answer safe)', () => {
    const ex = { type: 'mcq', choices: ['a', 'b', 'c', 'd'], answer: 'a' }
    const out = varyChoices(ex, mulberry32(2))
    expect([...out.choices].sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(out.choices).toContain('a')
  })
  it('leaves non-mcq/picture untouched', () => {
    const ex = { type: 'match', pairs: [['x', 'y']] }
    expect(varyChoices(ex, mulberry32(2))).toBe(ex)
  })
})

describe('buildDailyPractice', () => {
  it('returns size items tagged _practice', () => {
    const s = buildDailyPractice(level, '2026-08-13', { size: 3 })
    expect(s).toHaveLength(3)
    expect(s.every((e) => e._practice === true)).toBe(true)
  })
  it('is stable within a day but differs across days (order/selection)', () => {
    const a = buildDailyPractice(level, '2026-08-13', { size: 5 })
    const a2 = buildDailyPractice(level, '2026-08-13', { size: 5 })
    const b = buildDailyPractice(level, '2026-08-20', { size: 5 })
    expect(a.map((e) => e.prompt)).toEqual(a2.map((e) => e.prompt))
    expect(a.map((e) => e.prompt)).not.toEqual(b.map((e) => e.prompt))
  })
  it('places generated items into the pool', () => {
    const gen = [{ type: 'typein', prompt: 'gen', answer: 'x', _generated: true }]
    const s = buildDailyPractice(level, '2026-08-13', { size: 10, generated: gen })
    expect(s.some((e) => e.prompt === 'gen')).toBe(true)
  })
})
