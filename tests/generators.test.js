import { describe, it, expect } from 'vitest'
import {
  numberWord, genNumberTypein, genNumberMcq,
  genVocabPicture, genVocabMcq, genVocabTypein,
  genAntonymMcq, genVerbPastTypein, genVerbPastMcq, genSynonymMcq, genBusinessMcq, genBusinessTypein,
  generateForLevel, hasGenerators, hasBatchim, POOLS,
} from '../src/engine/generators.js'
import { mulberry32 } from '../src/engine/practice.js'
import { checkAnswer } from '../src/engine/scoring.js'
import { getLevels } from '../src/data/loadCurriculum.js'

describe('numberWord', () => {
  it('maps small numbers', () => {
    expect(numberWord(7)).toBe('seven')
    expect(numberWord(13)).toBe('thirteen')
    expect(numberWord(20)).toBe('twenty')
  })
  it('composes 21-99 with a hyphen', () => {
    expect(numberWord(21)).toBe('twenty-one')
    expect(numberWord(45)).toBe('forty-five')
    expect(numberWord(90)).toBe('ninety')
  })
})

describe('hasBatchim (Korean particle)', () => {
  it('detects a final consonant (받침)', () => {
    expect(hasBatchim('빨강')).toBe(true)  // ㅇ 받침
    expect(hasBatchim('달걀')).toBe(true)  // ㄹ 받침
    expect(hasBatchim('토끼')).toBe(false) // 모음 종성
    expect(hasBatchim('사과')).toBe(false)
  })
  it('generated vocab prompt uses the correct particle', () => {
    const ex = genVocabMcq(mulberry32(1), [{ word: 'red', ko: '빨강', emoji: '🔴' }])
    expect(ex.prompt).toBe("'빨강'은 영어로?") // 받침 → 은
  })
})

describe('number generators', () => {
  it('typein answer is the number word', () => {
    const ex = genNumberTypein(mulberry32(1), 10)
    expect(ex.type).toBe('typein')
    expect(checkAnswer(ex, ex.answer)).toBe(true)
  })
  it('mcq has 4 distinct choices with the answer among them', () => {
    const ex = genNumberMcq(mulberry32(2), 20)
    expect(ex.choices).toHaveLength(4)
    expect(new Set(ex.choices).size).toBe(4)
    expect(ex.choices).toContain(ex.answer)
    expect(checkAnswer(ex, ex.answer)).toBe(true)
  })
})

describe('vocab generators', () => {
  it('picture: 4 distinct emoji choices incl. the answer', () => {
    const ex = genVocabPicture(mulberry32(3), POOLS.animals)
    expect(ex.choices).toHaveLength(4)
    expect(new Set(ex.choices).size).toBe(4)
    expect(ex.choices).toContain(ex.answer)
  })
  it('mcq: answer word among 4 distinct choices', () => {
    const ex = genVocabMcq(mulberry32(4), POOLS.colors)
    expect(ex.choices).toHaveLength(4)
    expect(new Set(ex.choices).size).toBe(4)
    expect(checkAnswer(ex, ex.answer)).toBe(true)
  })
  it('typein: non-empty answer', () => {
    const ex = genVocabTypein(mulberry32(5), POOLS.food)
    expect(ex.answer.trim().length).toBeGreaterThan(0)
  })
})

describe('grammar / higher-difficulty generators', () => {
  const gens = { genAntonymMcq, genVerbPastMcq, genSynonymMcq, genBusinessMcq }
  for (const [name, fn] of Object.entries(gens)) {
    it(`${name}: 4 distinct choices incl. the answer`, () => {
      const ex = fn(mulberry32(11))
      expect(ex.choices).toHaveLength(4)
      expect(new Set(ex.choices).size).toBe(4)
      expect(checkAnswer(ex, ex.answer)).toBe(true)
    })
  }
  it('typein generators produce a non-empty answer', () => {
    expect(genVerbPastTypein(mulberry32(1)).answer.trim().length).toBeGreaterThan(0)
    expect(genBusinessTypein(mulberry32(1)).answer.trim().length).toBeGreaterThan(0)
  })
})

describe('generateForLevel', () => {
  it('has generators for every curriculum level now', () => {
    expect(hasGenerators('kinder')).toBe(true)
    expect(hasGenerators('grade3')).toBe(true)
    expect(hasGenerators('work3')).toBe(true)
    expect(hasGenerators('__nope__')).toBe(false)
  })
  it('returns [] for an unknown level', () => {
    expect(generateForLevel('__nope__', mulberry32(1), 6)).toEqual([])
  })
  it('produces `count` valid, deterministic exercises for every level', () => {
    for (const lvl of getLevels()) {
      const a = generateForLevel(lvl.id, mulberry32(9), 6)
      const b = generateForLevel(lvl.id, mulberry32(9), 6)
      expect(a.length, lvl.id).toBe(6)
      expect(a).toEqual(b)
      for (const ex of a) {
        expect(ex._generated).toBe(true)
        if (ex.type === 'mcq' || ex.type === 'picture') {
          expect(ex.choices, `${lvl.id}/${ex.prompt}`).toContain(ex.answer)
          expect(new Set(ex.choices).size, `${lvl.id}/${ex.prompt}`).toBe(4)
        } else {
          expect(String(ex.answer).trim().length).toBeGreaterThan(0)
        }
      }
    }
  })
})
