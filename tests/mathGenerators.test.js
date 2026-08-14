import { describe, it, expect } from 'vitest'
import { generateMathForLevel, hasMathGenerators, MATH_BANDS } from '../src/engine/mathGenerators.js'
import { mulberry32 } from '../src/engine/practice.js'
import { checkAnswer } from '../src/engine/scoring.js'

// Solve a generated math item by parsing its own prompt is overkill; instead trust the
// generator's answer and assert it grades itself correct + structural invariants.
describe('generateMathForLevel', () => {
  it('has a band for every declared level and none for unknown', () => {
    expect(hasMathGenerators('kinder')).toBe(true)
    expect(hasMathGenerators('work3')).toBe(true)
    expect(hasMathGenerators('__nope__')).toBe(false)
    expect(generateMathForLevel('__nope__', mulberry32(1), 5)).toEqual([])
  })

  it('produces `count` deterministic, self-consistent items for every band', () => {
    for (const id of Object.keys(MATH_BANDS)) {
      const a = generateMathForLevel(id, mulberry32(7), 6)
      const b = generateMathForLevel(id, mulberry32(7), 6)
      expect(a.length, id).toBe(6)
      expect(a).toEqual(b)
      for (const ex of a) {
        expect(ex._generated).toBe(true)
        expect(['typein', 'mcq']).toContain(ex.type)
        // the declared answer must grade as correct
        const resp = ex.type === 'mcq' ? ex.answer : ex.answer
        expect(checkAnswer(ex, resp), `${id}/${ex.prompt}`).toBe(true)
        if (ex.type === 'mcq') {
          expect(ex.choices).toContain(ex.answer)
          expect(new Set(ex.choices).size).toBe(4)
        } else {
          expect(String(ex.answer).length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('kinder arithmetic answers are correct (spot check add/sub)', () => {
    const items = generateMathForLevel('kinder', mulberry32(3), 20)
    for (const ex of items) {
      const m = ex.prompt.match(/^(\d+) ([+−]) (\d+) = \?$/)
      if (!m) continue
      const [, x, op, y] = m
      const expected = op === '+' ? +x + +y : +x - +y
      expect(Number(ex.answer)).toBe(expected)
    }
  })
})
