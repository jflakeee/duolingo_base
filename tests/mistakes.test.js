import { describe, it, expect } from 'vitest'
import { collectMistakes, mistakeReviewExercises, masteryLabel } from '../src/engine/mistakes.js'

const mcq = (p, a) => ({ type: 'mcq', prompt: p, choices: [a, 'x', 'y', 'z'], answer: a })

function progressWith(subjects, active = 'english', topReviewQueue) {
  return {
    activeSubject: active,
    subjects,
    reviewQueue: topReviewQueue ?? subjects[active]?.reviewQueue ?? [],
    completedLessons: subjects[active]?.completedLessons ?? [],
  }
}

describe('masteryLabel', () => {
  it('maps boxes to human labels', () => {
    expect(masteryLabel(0)).toBe('새 오답')
    expect(masteryLabel(4)).toBe('완성 직전')
  })
})

describe('collectMistakes', () => {
  it('aggregates across subjects in registry order with due/total counts', () => {
    const p = progressWith({
      english: { reviewQueue: [{ key: 'e#0', ex: mcq('cat?', 'cat'), box: 0, dueAt: 0 }], completedLessons: [] },
      math: { reviewQueue: [{ key: 'm#0', ex: mcq('2+2?', '4'), box: 2, dueAt: 999 }], completedLessons: [] },
    }, 'english')
    const r = collectMistakes(p, 100)
    expect(r.total).toBe(2)
    expect(r.dueTotal).toBe(1) // english due (0<=100), math not due (999>100)
    expect(r.groups.map((g) => g.subjectId)).toEqual(['english', 'math']) // registry order
    const eng = r.groups.find((g) => g.subjectId === 'english')
    expect(eng.items[0]).toMatchObject({ key: 'e#0', prompt: 'cat?', answerText: 'cat', box: 0, mastery: '새 오답', due: true })
  })

  it('uses the top-level mirror for the active subject (freshest state)', () => {
    // subjects.english is stale (empty); top-level reviewQueue has the real item
    const p = progressWith(
      { english: { reviewQueue: [], completedLessons: [] } },
      'english',
      [{ key: 'e#1', ex: mcq('dog?', 'dog'), box: 1, dueAt: 0 }],
    )
    const r = collectMistakes(p, 0)
    expect(r.total).toBe(1)
    expect(r.groups[0].items[0].key).toBe('e#1')
  })

  it('skips subjects with empty queues and returns empty cleanly', () => {
    const r = collectMistakes(progressWith({ english: { reviewQueue: [], completedLessons: [] } }), 0)
    expect(r).toEqual({ total: 0, dueTotal: 0, groups: [] })
  })
})

describe('mistakeReviewExercises', () => {
  it('returns only mistakes tagged with _reviewKey, due-first then weakest box', () => {
    const q = [
      { key: 'a', ex: mcq('A', 'a'), box: 3, dueAt: 0 },   // due, strong
      { key: 'b', ex: mcq('B', 'b'), box: 0, dueAt: 0 },   // due, weak
      { key: 'c', ex: mcq('C', 'c'), box: 1, dueAt: 999 }, // not due
    ]
    const ex = mistakeReviewExercises(q, { now: 100, limit: 20 })
    expect(ex.map((e) => e._reviewKey)).toEqual(['b', 'a', 'c'])
    expect(ex[0]).toMatchObject({ type: 'mcq', prompt: 'B', _reviewKey: 'b' })
  })

  it('caps at limit', () => {
    const q = Array.from({ length: 5 }, (_, i) => ({ key: `k${i}`, ex: mcq(`P${i}`, 'x'), box: 0, dueAt: 0 }))
    expect(mistakeReviewExercises(q, { now: 0, limit: 3 })).toHaveLength(3)
  })
})
