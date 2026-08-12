import { describe, it, expect } from 'vitest'
import { classroomSummary, sortStudents } from '../src/engine/classroom.js'

const S = [
  { memberId: 'A', pct: 40, xp: 100, streakCount: 2 },
  { memberId: 'B', pct: 80, xp: 300, streakCount: 5 },
  { memberId: 'C', pct: 60, xp: 200, streakCount: 1 },
]

describe('classroomSummary', () => {
  it('returns zeros for an empty class', () => {
    expect(classroomSummary([])).toEqual({ count: 0, avgPct: 0, avgXp: 0, avgStreak: 0 })
  })
  it('averages the class metrics', () => {
    expect(classroomSummary(S)).toEqual({ count: 3, avgPct: 60, avgXp: 200, avgStreak: 3 })
  })
})

describe('sortStudents', () => {
  it('sorts by completion percentage descending (default)', () => {
    expect(sortStudents(S).map((s) => s.memberId)).toEqual(['B', 'C', 'A'])
  })
  it('sorts by xp', () => {
    expect(sortStudents(S, 'xp').map((s) => s.memberId)).toEqual(['B', 'C', 'A'])
  })
  it('sorts by streak', () => {
    expect(sortStudents(S, 'streak').map((s) => s.memberId)).toEqual(['B', 'A', 'C'])
  })
  it('does not mutate the input', () => {
    const copy = [...S]
    sortStudents(S)
    expect(S).toEqual(copy)
  })
})
