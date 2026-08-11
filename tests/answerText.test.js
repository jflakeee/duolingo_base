import { describe, it, expect } from 'vitest'
import { correctAnswerText } from '../src/engine/answerText.js'

describe('correctAnswerText', () => {
  it('mcq → the answer string', () => {
    expect(correctAnswerText({ type: 'mcq', answer: 'Hello' })).toBe('Hello')
  })
  it('picture → emoji + word', () => {
    expect(correctAnswerText({ type: 'picture', answer: '🍎', word: 'apple' })).toBe('🍎 apple')
  })
  it('wordbank → answer joined by spaces', () => {
    expect(correctAnswerText({ type: 'wordbank', answer: ['I', 'like', 'blue'] })).toBe('I like blue')
  })
  it('listen → answer joined by spaces', () => {
    expect(correctAnswerText({ type: 'listen', answer: ['I', 'am', 'happy'] })).toBe('I am happy')
  })
  it('match → en=ko pairs joined by comma', () => {
    expect(correctAnswerText({ type: 'match', pairs: [['red', '빨강'], ['blue', '파랑']] }))
      .toBe('red=빨강, blue=파랑')
  })
  it('unknown type → empty string', () => {
    expect(correctAnswerText({ type: 'x' })).toBe('')
  })
})
