import { describe, it, expect } from 'vitest'
import {
  genSequenceMcq, genOddOneOutMcq, genSyllogismMcq, genAnalogyMcq, genInferenceReading, genLogicOrder, generateLogicForLevel,
} from '../src/engine/logicGenerators.js'
import { mulberry32 } from '../src/engine/practice.js'
import { checkAnswer } from '../src/engine/scoring.js'
import logic from '../src/data/subjects/logic.json'

describe('logic generators', () => {
  const mcqs = { genSequenceMcq, genOddOneOutMcq, genSyllogismMcq, genAnalogyMcq }
  for (const [name, fn] of Object.entries(mcqs)) {
    it(`${name}: 4 distinct choices incl. the answer`, () => {
      // sweep seeds to catch distractor collisions in generated sequences
      for (let seed = 1; seed <= 40; seed++) {
        const ex = fn(mulberry32(seed))
        expect(ex.type, name).toBe('mcq')
        expect(ex.choices, `${name}#${seed}`).toHaveLength(4)
        expect(new Set(ex.choices).size, `${name}#${seed}`).toBe(4)
        expect(ex.choices).toContain(ex.answer)
        expect(checkAnswer(ex, ex.answer)).toBe(true)
      }
    })
  }

  it('sequence: the answer continues the arithmetic/geometric rule', () => {
    const ex = genSequenceMcq(mulberry32(11))
    expect(checkAnswer(ex, ex.answer)).toBe(true)
    expect(checkAnswer(ex, ex.choices.find((c) => c !== ex.answer))).toBe(false)
  })

  it('inference generator is a reading exercise, graded like mcq', () => {
    const ex = genInferenceReading(mulberry32(3))
    expect(ex.type).toBe('reading')
    expect(ex.passage.length).toBeGreaterThan(0)
    expect(ex.choices).toContain(ex.answer)
    expect(checkAnswer(ex, ex.answer)).toBe(true)
  })

  it('order: items are a permutation of the answer, graded on exact sequence', () => {
    const ex = genLogicOrder(mulberry32(4))
    expect(ex.type).toBe('order')
    expect([...ex.items].sort()).toEqual([...ex.answer].sort())
    expect(ex.items).not.toEqual(ex.answer)
    expect(checkAnswer(ex, ex.answer)).toBe(true)
    expect(checkAnswer(ex, [...ex.answer].reverse())).toBe(false)
  })
})

describe('generateLogicForLevel', () => {
  it('produces `count` valid, deterministic items for every level band', () => {
    for (const id of ['kinder', 'grade4', 'middle2', 'high1', 'work3']) {
      const a = generateLogicForLevel(id, mulberry32(9), 6)
      const b = generateLogicForLevel(id, mulberry32(9), 6)
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
    expect(generateLogicForLevel('kinder', mulberry32(1), 0)).toEqual([])
  })
})

describe('logic.json curriculum', () => {
  it('has 20 levels and every authored exercise is self-consistent', () => {
    expect(logic.levels).toHaveLength(20)
    let count = 0
    for (const lv of logic.levels) {
      for (const unit of lv.units) {
        for (const lesson of unit.lessons) {
          for (const ex of lesson.exercises) {
            count++
            expect(checkAnswer(ex, ex.answer)).toBe(true)
            if (ex.type !== 'order') {
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
