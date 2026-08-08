import { describe, it, expect } from 'vitest'
import { checkAnswer, arraysEqual } from '../src/engine/scoring.js'

describe('mcq', () => {
  const ex = { type: 'mcq', answer: 'Hello' }
  it('correct when choice equals answer', () => {
    expect(checkAnswer(ex, 'Hello')).toBe(true)
  })
  it('wrong otherwise', () => {
    expect(checkAnswer(ex, 'Bye')).toBe(false)
  })
})

describe('wordbank / listen (ordered tokens)', () => {
  const ex = { type: 'wordbank', answer: ['I', 'like', 'blue'] }
  it('correct on exact order', () => {
    expect(checkAnswer(ex, ['I', 'like', 'blue'])).toBe(true)
  })
  it('wrong on different order', () => {
    expect(checkAnswer(ex, ['like', 'I', 'blue'])).toBe(false)
  })
  it('wrong on wrong length', () => {
    expect(checkAnswer(ex, ['I', 'like'])).toBe(false)
  })
})

describe('match', () => {
  const ex = { type: 'match', pairs: [['red', '빨강'], ['blue', '파랑']] }
  it('correct when every pair mapped correctly', () => {
    expect(checkAnswer(ex, { red: '빨강', blue: '파랑' })).toBe(true)
  })
  it('wrong when any pair mismatched', () => {
    expect(checkAnswer(ex, { red: '파랑', blue: '빨강' })).toBe(false)
  })
})

describe('arraysEqual', () => {
  it('true for same', () => expect(arraysEqual([1, 2], [1, 2])).toBe(true))
  it('false for diff', () => expect(arraysEqual([1], [1, 2])).toBe(false))
})
