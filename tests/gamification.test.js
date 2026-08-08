import { describe, it, expect } from 'vitest'
import {
  START_HEARTS, XP_CORRECT, XP_PERFECT_BONUS,
  loseHeart, xpForLesson, updateStreak, addDailyXp,
  HEART_REGEN_MS, regenHearts, msUntilNextHeart,
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

describe('regenHearts', () => {
  const T = 1_000_000_000_000 // arbitrary now baseline

  it('does not regen when full', () => {
    expect(regenHearts(START_HEARTS, T - 10 * HEART_REGEN_MS, T))
      .toEqual({ hearts: START_HEARTS, heartsUpdatedAt: T - 10 * HEART_REGEN_MS })
  })
  it('does not regen before 30 minutes', () => {
    const updatedAt = T - (HEART_REGEN_MS - 1)
    expect(regenHearts(2, updatedAt, T)).toEqual({ hearts: 2, heartsUpdatedAt: updatedAt })
  })
  it('+1 after 31 minutes and advances clock by exactly one interval (not to now)', () => {
    const updatedAt = T - 31 * 60 * 1000
    const r = regenHearts(2, updatedAt, T)
    expect(r.hearts).toBe(3)
    expect(r.heartsUpdatedAt).toBe(updatedAt + HEART_REGEN_MS)
    expect(r.heartsUpdatedAt).not.toBe(T)
  })
  it('caps at 5 and sets clock to now', () => {
    const updatedAt = T - 100 * HEART_REGEN_MS
    expect(regenHearts(1, updatedAt, T)).toEqual({ hearts: START_HEARTS, heartsUpdatedAt: T })
  })
})

describe('msUntilNextHeart', () => {
  const T = 1_000_000_000_000
  it('returns 0 when full', () => {
    expect(msUntilNextHeart(START_HEARTS, T - HEART_REGEN_MS, T)).toBe(0)
  })
  it('returns a positive value < 30min when not full', () => {
    const rem = msUntilNextHeart(2, T - 10 * 60 * 1000, T)
    expect(rem).toBeGreaterThan(0)
    expect(rem).toBeLessThan(HEART_REGEN_MS)
    expect(rem).toBe(HEART_REGEN_MS - 10 * 60 * 1000)
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
