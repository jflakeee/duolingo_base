import { describe, it, expect } from 'vitest'
import {
  makeDailyQuests, ensureQuests, applyLessonToQuests, isComplete, claimQuest,
} from '../src/engine/quests.js'

describe('quests', () => {
  it('makeDailyQuests returns 3 fresh items for the day', () => {
    const q = makeDailyQuests('2026-08-10')
    expect(q.day).toBe('2026-08-10')
    expect(q.items).toHaveLength(3)
    expect(q.items.every((i) => i.progress === 0 && i.claimed === false)).toBe(true)
  })
  it('ensureQuests regenerates on a new day, keeps same-day', () => {
    const q = makeDailyQuests('2026-08-09')
    expect(ensureQuests(q, '2026-08-09')).toBe(q)
    expect(ensureQuests(q, '2026-08-10').day).toBe('2026-08-10')
    expect(ensureQuests(null, '2026-08-10').day).toBe('2026-08-10')
    expect(ensureQuests({ day: null, items: [] }, '2026-08-10').day).toBe('2026-08-10')
  })
  it('applyLessonToQuests advances xp/lessons/perfect and caps', () => {
    let q = makeDailyQuests('2026-08-10')
    q = applyLessonToQuests(q, { xpGained: 70, perfect: true })
    const xp = q.items.find((i) => i.type === 'earnXp')
    const lessons = q.items.find((i) => i.type === 'lessons')
    const perfect = q.items.find((i) => i.type === 'perfect')
    expect(xp.progress).toBe(xp.target)      // capped at target
    expect(lessons.progress).toBe(1)
    expect(perfect.progress).toBe(1)
  })
  it('non-perfect lesson does not advance the perfect quest', () => {
    let q = makeDailyQuests('2026-08-10')
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    expect(q.items.find((i) => i.type === 'perfect').progress).toBe(0)
  })
  it('claimQuest rewards a complete unclaimed quest once', () => {
    let q = makeDailyQuests('2026-08-10')
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    const lessons = q.items.find((i) => i.type === 'lessons')
    // lessons target is 3; make it complete
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    expect(isComplete(q.items.find((i) => i.type === 'lessons'))).toBe(true)
    const r1 = claimQuest(q, 'lessons')
    expect(r1.reward).toBe(lessons.reward)
    expect(r1.quests.items.find((i) => i.id === 'lessons').claimed).toBe(true)
    const r2 = claimQuest(r1.quests, 'lessons')
    expect(r2.reward).toBe(0) // already claimed
  })
  it('claimQuest on an incomplete quest gives nothing', () => {
    const q = makeDailyQuests('2026-08-10')
    expect(claimQuest(q, 'perfect').reward).toBe(0)
  })
})
