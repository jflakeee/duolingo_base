import { describe, it, expect } from 'vitest'
import { checkAnswer, arraysEqual, normalizeText } from '../src/engine/scoring.js'

describe('typein', () => {
  const ex = { type: 'typein', prompt: 'p', answer: 'apple', accept: ['an apple'] }
  it('accepts exact answer', () => {
    expect(checkAnswer(ex, 'apple')).toBe(true)
  })
  it('is forgiving of case, whitespace, and trailing punctuation', () => {
    expect(checkAnswer(ex, '  Apple. ')).toBe(true)
  })
  it('accepts an alternate from accept[]', () => {
    expect(checkAnswer(ex, 'AN  apple')).toBe(true)
  })
  it('rejects a wrong word', () => {
    expect(checkAnswer(ex, 'banana')).toBe(false)
  })
  it('normalizeText lowercases, trims, and collapses spaces', () => {
    expect(normalizeText('  Hello   World! ')).toBe('hello world')
  })
})

describe('picture', () => {
  const ex = { type: 'picture', word: 'apple', choices: ['🍎', '🐱', '🏠', '🔴'], answer: '🍎' }
  it('correct when response equals answer emoji', () => {
    expect(checkAnswer(ex, '🍎')).toBe(true)
  })
  it('wrong when response is a different emoji', () => {
    expect(checkAnswer(ex, '🐱')).toBe(false)
  })
})

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
