import { describe, it, expect } from 'vitest'
import {
  genConnectiveMcq, genFallacyMcq, genTopicReading, genReadingComp, genOrder, generateEssayForLevel,
} from '../src/engine/essayGenerators.js'
import { mulberry32 } from '../src/engine/practice.js'
import { checkAnswer } from '../src/engine/scoring.js'
import essay from '../src/data/subjects/essay.json'

describe('essay generators', () => {
  const mcqs = { genConnectiveMcq, genFallacyMcq }
  for (const [name, fn] of Object.entries(mcqs)) {
    it(`${name}: 4 distinct choices incl. the answer`, () => {
      const ex = fn(mulberry32(7))
      expect(ex.type).toBe('mcq')
      expect(ex.choices).toHaveLength(4)
      expect(new Set(ex.choices).size).toBe(4)
      expect(checkAnswer(ex, ex.answer)).toBe(true)
      expect(checkAnswer(ex, ex.choices.find((c) => c !== ex.answer))).toBe(false)
    })
  }

  it('reading generators carry a passage and grade like mcq', () => {
    for (const fn of [genTopicReading, genReadingComp]) {
      const ex = fn(mulberry32(3))
      expect(ex.type).toBe('reading')
      expect(ex.passage.length).toBeGreaterThan(0)
      expect(ex.choices).toContain(ex.answer)
      expect(checkAnswer(ex, ex.answer)).toBe(true)
      expect(checkAnswer(ex, '엉뚱한 답')).toBe(false)
    }
  })

  it('order: items are a permutation of the answer, graded on exact sequence', () => {
    const ex = genOrder(mulberry32(4))
    expect(ex.type).toBe('order')
    expect([...ex.items].sort()).toEqual([...ex.answer].sort())
    expect(ex.items).not.toEqual(ex.answer) // starts scrambled
    expect(checkAnswer(ex, ex.answer)).toBe(true)
    expect(checkAnswer(ex, [...ex.answer].reverse())).toBe(false)
  })
})

describe('generateEssayForLevel', () => {
  it('produces `count` valid, deterministic items for every level band', () => {
    for (const id of ['kinder', 'grade4', 'middle2', 'high1', 'work3']) {
      const a = generateEssayForLevel(id, mulberry32(9), 6)
      const b = generateEssayForLevel(id, mulberry32(9), 6)
      expect(a.length, id).toBe(6)
      expect(a).toEqual(b)
      for (const ex of a) {
        expect(ex._generated).toBe(true)
        if (ex.type === 'order') {
          expect([...ex.items].sort()).toEqual([...ex.answer].sort())
        } else {
          expect(ex.choices).toContain(ex.answer)
          expect(new Set(ex.choices).size).toBe(4)
        }
      }
    }
  })
  it('returns [] for empty count', () => {
    expect(generateEssayForLevel('kinder', mulberry32(1), 0)).toEqual([])
  })
})

describe('essay.json curriculum', () => {
  it('has 20 levels and every authored exercise is self-consistent', () => {
    expect(essay.levels).toHaveLength(20)
    let count = 0
    for (const lv of essay.levels) {
      for (const unit of lv.units) {
        for (const lesson of unit.lessons) {
          for (const ex of lesson.exercises) {
            count++
            expect(checkAnswer(ex, ex.answer)).toBe(true)
            if (ex.type === 'reading' || ex.type === 'mcq') {
              expect(ex.choices).toContain(ex.answer)
              expect(new Set(ex.choices).size).toBe(ex.choices.length)
            }
          }
        }
      }
    }
    expect(count).toBe(200)
  })
})
