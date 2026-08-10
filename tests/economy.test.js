import { describe, it, expect } from 'vitest'
import {
  gemsForLesson, buyHeartRefill, buyStreakFreeze,
  PRICE_HEART_REFILL, PRICE_STREAK_FREEZE, MAX_FREEZES,
} from '../src/engine/economy.js'

describe('gemsForLesson', () => {
  it('base 2, +3 on perfect', () => {
    expect(gemsForLesson({ mistakes: 1 })).toBe(2)
    expect(gemsForLesson({ mistakes: 0 })).toBe(5)
  })
})

describe('buyHeartRefill', () => {
  it('refills to 5 and deducts price', () => {
    expect(buyHeartRefill(PRICE_HEART_REFILL, 2)).toEqual({ ok: true, gems: 0, hearts: 5 })
  })
  it('fails when hearts full', () => {
    expect(buyHeartRefill(999, 5)).toEqual({ ok: false, gems: 999, hearts: 5 })
  })
  it('fails when too few gems', () => {
    expect(buyHeartRefill(10, 1)).toEqual({ ok: false, gems: 10, hearts: 1 })
  })
})

describe('buyStreakFreeze', () => {
  it('adds a freeze and deducts price', () => {
    expect(buyStreakFreeze(PRICE_STREAK_FREEZE, 0)).toEqual({ ok: true, gems: 0, freezes: 1 })
  })
  it('fails at the cap', () => {
    expect(buyStreakFreeze(999, MAX_FREEZES)).toEqual({ ok: false, gems: 999, freezes: MAX_FREEZES })
  })
  it('fails when too few gems', () => {
    expect(buyStreakFreeze(10, 0)).toEqual({ ok: false, gems: 10, freezes: 0 })
  })
})
