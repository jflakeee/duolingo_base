import { describe, it, expect } from 'vitest'
import { parseDeck } from '../src/engine/deckParser.js'
import { checkAnswer } from '../src/engine/scoring.js'

describe('parseDeck', () => {
  it('2 fields → typein', () => {
    const { exercises, errors } = parseDeck('사과는 영어로? | apple')
    expect(errors).toHaveLength(0)
    expect(exercises[0]).toEqual({ type: 'typein', prompt: '사과는 영어로?', answer: 'apple' })
    expect(checkAnswer(exercises[0], 'apple')).toBe(true)
  })

  it('3+ fields → mcq with answer first, distinct choices ≤4', () => {
    const { exercises } = parseDeck('가장 큰 행성은? | 목성 | 지구 | 화성 | 금성 | 수성')
    const ex = exercises[0]
    expect(ex.type).toBe('mcq')
    expect(ex.answer).toBe('목성')
    expect(ex.choices).toHaveLength(4) // capped
    expect(ex.choices).toContain('목성')
    expect(new Set(ex.choices).size).toBe(4)
    expect(checkAnswer(ex, '목성')).toBe(true)
  })

  it('dedupes repeated choices', () => {
    const { exercises } = parseDeck('2+2? | 4 | 4 | 5 | 5 | 6')
    expect(exercises[0].choices).toEqual(['4', '5', '6'])
  })

  it('skips blank lines and parses multiple lines', () => {
    const { exercises } = parseDeck('Q1 | a\n\n  \nQ2 | b | c')
    expect(exercises).toHaveLength(2)
    expect(exercises.map((e) => e.type)).toEqual(['typein', 'mcq'])
  })

  it('collects errors: missing answer, empty prompt, all-same choices', () => {
    const { exercises, errors } = parseDeck('정답없음\n | 정답만\n같은보기? | x | x')
    expect(exercises).toHaveLength(0)
    expect(errors).toHaveLength(3)
    expect(errors[0].line).toBe(1)
    expect(errors[1].line).toBe(2)
    expect(errors[2].reason).toMatch(/보기/)
  })

  it('handles empty input', () => {
    expect(parseDeck('')).toEqual({ exercises: [], errors: [] })
    expect(parseDeck(null)).toEqual({ exercises: [], errors: [] })
  })
})
