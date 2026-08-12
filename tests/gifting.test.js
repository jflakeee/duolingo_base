import { describe, it, expect } from 'vitest'
import { encodeGift, decodeGift, applyGift, giftItem, GIFT_ITEMS } from '../src/engine/gifting.js'
import { START_HEARTS } from '../src/engine/gamification.js'

describe('gift codec', () => {
  it('round-trips a gift', () => {
    const code = encodeGift({ id: 'hearts' })
    expect(code.startsWith('LDG1:')).toBe(true)
    expect(decodeGift(code)).toEqual({ id: 'hearts' })
  })
  it('rejects a wrong prefix or unknown item', () => {
    expect(decodeGift('LDX1:abc')).toBeNull()
    expect(decodeGift(encodeGift({ id: 'nope' }))).toBeNull()
  })
})

describe('applyGift', () => {
  it('hearts → refills to max', () => {
    expect(applyGift({ hearts: 0, streak: {} }, { id: 'hearts' }).hearts).toBe(START_HEARTS)
  })
  it('freeze → +1 streak freeze', () => {
    expect(applyGift({ streak: { freezes: 1 } }, { id: 'freeze' }).streak.freezes).toBe(2)
  })
  it('gems50 → +50 gems', () => {
    expect(applyGift({ gems: 10 }, { id: 'gems50' }).gems).toBe(60)
  })
  it('ignores an unknown gift', () => {
    const p = { gems: 5 }
    expect(applyGift(p, { id: 'x' })).toBe(p)
  })
})

describe('catalog', () => {
  it('every item has id/label/cost', () => {
    for (const g of GIFT_ITEMS) {
      expect(g.id && g.label && g.cost > 0).toBeTruthy()
      expect(giftItem(g.id)).toEqual(g)
    }
  })
})
