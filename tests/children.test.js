import { describe, it, expect } from 'vitest'
import { childSummary, addChild, removeChild } from '../src/engine/children.js'

const patch = { memberId: 'LD-AAAA-2222', xp: 120, streakCount: 4, gems: 8, completedLessons: ['a', 'b', 'c'] }

describe('childSummary', () => {
  it('summarizes decoded progress with a completion percentage', () => {
    const s = childSummary(patch, 10, 1000)
    expect(s).toEqual({ memberId: 'LD-AAAA-2222', xp: 120, streakCount: 4, gems: 8, completed: 3, total: 10, pct: 30, addedAt: 1000 })
  })
  it('guards against zero total', () => {
    expect(childSummary({ completedLessons: [] }, 0).pct).toBe(0)
  })
})

describe('addChild', () => {
  it('adds a new child', () => {
    expect(addChild([], childSummary(patch, 10))).toHaveLength(1)
  })
  it('upserts (refreshes) an existing child by memberId', () => {
    const first = childSummary({ ...patch, xp: 100 }, 10)
    const refreshed = childSummary({ ...patch, xp: 200 }, 10)
    const out = addChild([first], refreshed)
    expect(out).toHaveLength(1)
    expect(out[0].xp).toBe(200)
  })
})

describe('removeChild', () => {
  it('removes by memberId', () => {
    const list = [childSummary(patch, 10)]
    expect(removeChild(list, 'LD-AAAA-2222')).toEqual([])
  })
})
