import { describe, it, expect } from 'vitest'
import { genKoAntonymMcq, genKoSynonymMcq, genKoSpellingMcq, genKoDictation, generateKoreanForLevel } from '../src/engine/koreanGenerators.js'
import { mulberry32 } from '../src/engine/practice.js'
import { checkAnswer } from '../src/engine/scoring.js'

describe('korean generators', () => {
  const mcqs = { genKoAntonymMcq, genKoSynonymMcq, genKoSpellingMcq }
  for (const [name, fn] of Object.entries(mcqs)) {
    it(`${name}: 4 distinct choices incl. the answer`, () => {
      const ex = fn(mulberry32(5))
      expect(ex.choices).toHaveLength(4)
      expect(new Set(ex.choices).size).toBe(4)
      expect(checkAnswer(ex, ex.answer)).toBe(true)
    })
  }
  it('dictation carries ko-KR lang and grades the sentence', () => {
    const ex = genKoDictation(mulberry32(2))
    expect(ex.type).toBe('dictation')
    expect(ex.lang).toBe('ko-KR')
    expect(checkAnswer(ex, ex.answer)).toBe(true)
    expect(checkAnswer(ex, ex.answer + '.')).toBe(true) // forgiving punctuation
  })
})

describe('generateKoreanForLevel', () => {
  it('produces `count` valid, deterministic items for every level band', () => {
    for (const id of ['kinder', 'grade2', 'grade4', 'middle1', 'high2', 'work3']) {
      const a = generateKoreanForLevel(id, mulberry32(9), 6)
      const b = generateKoreanForLevel(id, mulberry32(9), 6)
      expect(a.length, id).toBe(6)
      expect(a).toEqual(b)
      for (const ex of a) {
        expect(ex._generated).toBe(true)
        if (ex.type === 'mcq') {
          expect(ex.choices).toContain(ex.answer)
          expect(new Set(ex.choices).size).toBe(4)
        } else {
          expect(String(ex.answer).trim().length).toBeGreaterThan(0)
        }
      }
    }
  })
  it('returns [] for empty count', () => {
    expect(generateKoreanForLevel('kinder', mulberry32(1), 0)).toEqual([])
  })
})
