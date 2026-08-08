import { describe, it, expect } from 'vitest'
import {
  START_HEARTS, XP_CORRECT, XP_PERFECT_BONUS,
  loseHeart, xpForLesson, updateStreak, addDailyXp,
} from '../src/engine/gamification.js'

describe('hearts', () => {
  it('starts at 5', () => expect(START_HEARTS).toBe(5))
  it('decrements but not below 0', () => {
    expect(loseHeart(3)).toBe(2)
    expect(loseHeart(0)).toBe(0)
  })
})

describe('xpForLesson', () => {
  it('10 per correct', () => {
    expect(xpForLesson({ correct: 4, total: 5, mistakes: 1 })).toBe(4 * XP_CORRECT)
  })
  it('adds perfect bonus when no mistakes', () => {
    expect(xpForLesson({ correct: 5, total: 5, mistakes: 0 }))
      .toBe(5 * XP_CORRECT + XP_PERFECT_BONUS)
  })
})

describe('updateStreak', () => {
  const base = { count: 3, lastDay: '2026-08-07', freezes: 1 }
  it('increments on next day', () => {
    expect(updateStreak(base, '2026-08-08')).toEqual({ count: 4, lastDay: '2026-08-08', freezes: 1 })
  })
  it('no double-count same day', () => {
    expect(updateStreak(base, '2026-08-07')).toEqual(base)
  })
  it('freeze absorbs a single missed day', () => {
    expect(updateStreak(base, '2026-08-09'))
      .toEqual({ count: 4, lastDay: '2026-08-09', freezes: 0 })
  })
  it('resets when gap too big and no freeze', () => {
    const noFreeze = { count: 3, lastDay: '2026-08-01', freezes: 0 }
    expect(updateStreak(noFreeze, '2026-08-08'))
      .toEqual({ count: 1, lastDay: '2026-08-08', freezes: 0 })
  })
  it('starts at 1 from empty', () => {
    expect(updateStreak({ count: 0, lastDay: null, freezes: 1 }, '2026-08-08'))
      .toEqual({ count: 1, lastDay: '2026-08-08', freezes: 1 })
  })
})

describe('addDailyXp', () => {
  it('accumulates on same day', () => {
    expect(addDailyXp({ day: '2026-08-08', amount: 20 }, 10, '2026-08-08'))
      .toEqual({ day: '2026-08-08', amount: 30 })
  })
  it('resets on a new day', () => {
    expect(addDailyXp({ day: '2026-08-07', amount: 50 }, 10, '2026-08-08'))
      .toEqual({ day: '2026-08-08', amount: 10 })
  })
})
