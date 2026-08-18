import { describe, it, expect } from 'vitest'
import { buildCustomCurriculum, setCustomCurriculum, customCurriculum } from '../src/data/customSubject.js'
import { encodeDeck, decodeDeck, MAX_SHARE_EXERCISES } from '../src/engine/deckShare.js'

const ex = (p, a) => ({ type: 'typein', prompt: p, answer: a })
const deck = (id, name, n) => ({ id, name, exercises: Array.from({ length: n }, (_, i) => ex(`${name} Q${i}`, `a${i}`)), createdAt: 0 })

describe('buildCustomCurriculum', () => {
  it('maps each deck to a level, chunking exercises into 5-per-lesson', () => {
    const { levels } = buildCustomCurriculum([deck('d1', '영단어', 12)])
    expect(levels).toHaveLength(1)
    expect(levels[0]).toMatchObject({ id: 'd1', name: '영단어' })
    const lessons = levels[0].units[0].lessons
    expect(lessons.map((l) => l.exercises.length)).toEqual([5, 5, 2])
    expect(lessons[0].id).toBe('d1-l1')
  })

  it('single-lesson deck keeps the deck name as the lesson title', () => {
    const { levels } = buildCustomCurriculum([deck('d1', '한자', 3)])
    expect(levels[0].units[0].lessons[0].title).toBe('한자')
  })

  it('empty decks → no levels', () => {
    expect(buildCustomCurriculum([])).toEqual({ levels: [] })
    expect(buildCustomCurriculum(null)).toEqual({ levels: [] })
  })

  it('setCustomCurriculum updates the live holder read by customCurriculum()', () => {
    setCustomCurriculum([deck('d1', '덱', 6)])
    expect(customCurriculum().levels).toHaveLength(1)
    setCustomCurriculum([])
    expect(customCurriculum().levels).toHaveLength(0)
  })
})

describe('deckShare (LDD1)', () => {
  it('round-trips a deck through encode/decode, preserving Korean', () => {
    const d = { id: 'd1', name: '나의 사자성어', exercises: [ex('유비무환 뜻?', '미리 준비'), { type: 'mcq', prompt: '2+2', choices: ['4', '3'], answer: '4' }] }
    const code = encodeDeck(d)
    expect(code.startsWith('LDD1:')).toBe(true)
    const back = decodeDeck(code)
    expect(back.name).toBe('나의 사자성어')
    expect(back.exercises).toEqual(d.exercises)
  })

  it('caps shared exercises at the max', () => {
    const big = { id: 'b', name: 'big', exercises: Array.from({ length: MAX_SHARE_EXERCISES + 10 }, (_, i) => ex(`q${i}`, 'a')) }
    expect(decodeDeck(encodeDeck(big)).exercises).toHaveLength(MAX_SHARE_EXERCISES)
  })

  it('rejects non-LDD1 / malformed codes', () => {
    expect(decodeDeck('LDX1:abc')).toBeNull()
    expect(decodeDeck('garbage')).toBeNull()
    expect(decodeDeck(null)).toBeNull()
    expect(decodeDeck('LDD1:!!notbase64!!')).toBeNull()
  })
})
