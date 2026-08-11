import { describe, it, expect } from 'vitest'
import {
  recordMistake,
  buildReviewSession,
  applyReviewResult,
  dueCount,
  BOX_INTERVALS_MS,
} from '../src/engine/review.js'

const DAY = 24 * 60 * 60 * 1000
const item = (key, over = {}) => ({
  key,
  lessonId: key.split('#')[0],
  ex: over.ex ?? { type: 'mcq', prompt: key, choices: ['a', 'b'], answer: 'a' },
  box: over.box ?? 0,
  dueAt: over.dueAt ?? 0,
})

describe('recordMistake', () => {
  it('adds a new item at box 0 due now', () => {
    const q = recordMistake([], { key: 'L1#0', lessonId: 'L1', ex: {} }, 1000)
    expect(q).toHaveLength(1)
    expect(q[0].box).toBe(0)
    expect(q[0].dueAt).toBe(1000)
  })
  it('dedups by key (returns same ref)', () => {
    const q = [item('L1#0')]
    expect(recordMistake(q, { key: 'L1#0' }, 0)).toBe(q)
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
  it('puts due mistakes first, tagged with _reviewKey', () => {
    const state = { reviewQueue: [item('L1#0')], completedLessons: [] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0, now: 0 })
    expect(s[0]._reviewKey).toBe('L1#0')
  })
  it('excludes not-yet-due mistakes', () => {
    const state = { reviewQueue: [item('L1#0', { dueAt: 10 * DAY })], completedLessons: [] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0, now: 0 })
    expect(s).toEqual([])
  })
  it('orders due mistakes by weakest box first', () => {
    const state = {
      reviewQueue: [item('L1#1', { box: 2 }), item('L1#0', { box: 0 })],
      completedLessons: [],
    }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0, now: DAY })
    expect(s.map((e) => e._reviewKey)).toEqual(['L1#0', 'L1#1'])
  })
  it('fills from completed lessons up to limit (filler has null key)', () => {
    const state = { reviewQueue: [], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0, now: 0 })
    expect(s.length).toBe(2)
    expect(s.every((e) => e._reviewKey === null)).toBe(true)
  })
  it('excludes exercises already in the queue from filler', () => {
    const state = { reviewQueue: [item('L1#0')], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0, now: 0 })
    expect(s.length).toBe(2)
    expect(s.filter((e) => e._reviewKey === null).length).toBe(1)
  })
  it('respects limit with due mistakes taking priority', () => {
    const state = { reviewQueue: [item('L1#0'), item('L1#1')], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 1, rng: () => 0, now: 0 })
    expect(s.length).toBe(1)
    expect(s[0]._reviewKey).toBe('L1#0')
  })
  it('returns empty when nothing to review', () => {
    expect(buildReviewSession({ reviewQueue: [], completedLessons: [] }, lessonsById, {})).toEqual([])
  })
})

describe('applyReviewResult', () => {
  it('promotes a solved item to the next box and schedules dueAt', () => {
    const q = [item('L1#0', { box: 0 })]
    const out = applyReviewResult(q, ['L1#0'], [], 1000)
    expect(out[0].box).toBe(1)
    expect(out[0].dueAt).toBe(1000 + BOX_INTERVALS_MS[0])
  })
  it('resets a wrong item to box 0 due now', () => {
    const q = [item('L1#0', { box: 3, dueAt: 999 })]
    const out = applyReviewResult(q, [], ['L1#0'], 500)
    expect(out[0].box).toBe(0)
    expect(out[0].dueAt).toBe(500)
  })
  it('drops an item mastered at the last box', () => {
    const q = [item('L1#0', { box: BOX_INTERVALS_MS.length })]
    expect(applyReviewResult(q, ['L1#0'], [], 0)).toEqual([])
  })
  it('leaves untouched keys unchanged', () => {
    const q = [item('L1#0', { box: 2 })]
    expect(applyReviewResult(q, [], [], 0)).toEqual(q)
  })
})

describe('dueCount', () => {
  it('counts only items due at or before now', () => {
    const q = [item('a', { dueAt: 0 }), item('b', { dueAt: 5 * DAY })]
    expect(dueCount(q, DAY)).toBe(1)
  })
})
