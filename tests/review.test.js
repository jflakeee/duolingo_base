import { describe, it, expect } from 'vitest'
import { recordMistake, buildReviewSession, clearSolved } from '../src/engine/review.js'

const item = (key, ex) => ({
  key,
  lessonId: key.split('#')[0],
  ex: ex ?? { type: 'mcq', prompt: key, choices: ['a', 'b'], answer: 'a' },
})

describe('recordMistake', () => {
  it('adds a new item', () => {
    expect(recordMistake([], item('L1#0'))).toHaveLength(1)
  })
  it('dedups by key (returns same ref)', () => {
    const q = [item('L1#0')]
    expect(recordMistake(q, item('L1#0'))).toBe(q)
  })
})

describe('buildReviewSession', () => {
  const lessonsById = {
    L1: {
      exercises: [
        { type: 'mcq', prompt: 'a', choices: ['a'], answer: 'a' },
        { type: 'mcq', prompt: 'b', choices: ['b'], answer: 'b' },
      ],
    },
  }
  it('puts mistakes first, tagged with _reviewKey', () => {
    const state = { reviewQueue: [item('L1#0')], completedLessons: [] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0 })
    expect(s[0]._reviewKey).toBe('L1#0')
  })
  it('fills from completed lessons up to limit (filler has null key)', () => {
    const state = { reviewQueue: [], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0 })
    expect(s.length).toBe(2)
    expect(s.every((e) => e._reviewKey === null)).toBe(true)
  })
  it('excludes exercises already in the mistake queue from filler', () => {
    const state = { reviewQueue: [item('L1#0')], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0 })
    // L1#0 as mistake + only L1#1 as filler (L1#0 not duplicated)
    expect(s.length).toBe(2)
    expect(s.filter((e) => e._reviewKey === null).length).toBe(1)
  })
  it('respects limit with mistakes taking priority', () => {
    const state = { reviewQueue: [item('L1#0'), item('L1#1')], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 1, rng: () => 0 })
    expect(s.length).toBe(1)
    expect(s[0]._reviewKey).toBe('L1#0')
  })
  it('returns empty when nothing to review', () => {
    expect(buildReviewSession({ reviewQueue: [], completedLessons: [] }, lessonsById, {})).toEqual([])
  })
})

describe('clearSolved', () => {
  it('removes solved keys', () => {
    const q = [item('L1#0'), item('L1#1')]
    expect(clearSolved(q, ['L1#0']).map((x) => x.key)).toEqual(['L1#1'])
  })
})
