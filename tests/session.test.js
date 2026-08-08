import { describe, it, expect } from 'vitest'
import { createSession, answer, currentExercise } from '../src/engine/session.js'

const exercises = [
  { type: 'mcq', answer: 'A' },
  { type: 'mcq', answer: 'B' },
]

describe('session', () => {
  it('starts at first exercise, not done', () => {
    const s = createSession(exercises)
    expect(currentExercise(s).answer).toBe('A')
    expect(s.done).toBe(false)
    expect(s.total).toBe(2)
  })

  it('advances on correct answers and finishes', () => {
    let s = createSession(exercises)
    s = answer(s, true)
    expect(currentExercise(s).answer).toBe('B')
    s = answer(s, true)
    expect(s.done).toBe(true)
    expect(s.correct).toBe(2)
    expect(s.mistakes).toBe(0)
  })

  it('requeues a wrong exercise and counts a mistake', () => {
    let s = createSession(exercises)
    s = answer(s, false) // A wrong -> requeue
    expect(s.mistakes).toBe(1)
    expect(currentExercise(s).answer).toBe('B') // moved on to B
    s = answer(s, true) // B correct
    expect(currentExercise(s).answer).toBe('A') // A comes back
    s = answer(s, true) // A now correct
    expect(s.done).toBe(true)
    expect(s.correct).toBe(2)
    expect(s.mistakes).toBe(1)
  })

  it('progress reflects distinct completed count', () => {
    let s = createSession(exercises)
    expect(s.completed).toBe(0)
    s = answer(s, true)
    expect(s.completed).toBe(1)
  })
})
