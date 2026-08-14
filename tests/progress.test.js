import { describe, it, expect, beforeEach } from 'vitest'
import { loadProgress, saveProgress, resetProgress, defaultProgress, STORAGE_KEY } from '../src/store/progress.js'

beforeEach(() => localStorage.clear())

describe('progress store', () => {
  it('returns defaults when nothing saved', () => {
    expect(loadProgress()).toEqual(defaultProgress())
  })
  it('round-trips a saved value', () => {
    const p = defaultProgress()
    p.xp = 120
    p.completedLessons = ['kinder-u1-l1']
    p.subjects = { english: { completedLessons: ['kinder-u1-l1'], reviewQueue: [] } } // mirror
    saveProgress(p)
    expect(loadProgress()).toEqual(p)
  })
  it('reset clears storage back to defaults', () => {
    const p = defaultProgress()
    p.xp = 999
    saveProgress(p)
    resetProgress()
    expect(loadProgress()).toEqual(defaultProgress())
    expect(localStorage.getItem(STORAGE_KEY)).toBe(null)
  })
  it('tolerates corrupt JSON by returning defaults', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadProgress()).toEqual(defaultProgress())
  })
  it('defaults include v2 fields', () => {
    const p = defaultProgress()
    expect(p.gems).toBe(0)
    expect(p.dailyGoal).toBe(50)
    expect(p.onboarded).toBe(false)
    expect(p.settings).toEqual({ theme: 'auto' })
    expect(p.version).toBe(2)
  })
  it('defaults include gamification fields', () => {
    const p = defaultProgress()
    expect(p.quests).toEqual({ day: null, items: [] })
    expect(p.achievements).toEqual({})
    expect(p.perfectCount).toBe(0)
  })
  it('migrates a v1 save by filling new fields', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, xp: 30 }))
    const p = loadProgress()
    expect(p.xp).toBe(30)
    expect(p.gems).toBe(0)
    expect(p.onboarded).toBe(false)
    expect(p.settings).toEqual({ theme: 'auto' })
  })
  it('defaults include empty reviewQueue', () => {
    expect(defaultProgress().reviewQueue).toEqual([])
  })
  it('migrates old save without reviewQueue', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 40 }))
    expect(loadProgress().reviewQueue).toEqual([])
    expect(loadProgress().xp).toBe(40)
  })
  it('v2→v3: seeds subjects.english from old top-level progress', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, completedLessons: ['kinder-u1-l1', 'kinder-u1-l2'] }))
    const p = loadProgress()
    expect(p.activeSubject).toBe('english')
    expect(p.subjects.english.completedLessons).toEqual(['kinder-u1-l1', 'kinder-u1-l2'])
    expect(p.completedLessons).toEqual(['kinder-u1-l1', 'kinder-u1-l2']) // top-level mirror
  })
  it('v3: top-level mirrors the active subject on load', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2, activeSubject: 'math', completedLessons: ['ignored'],
      subjects: { english: { completedLessons: ['e1'], reviewQueue: [] }, math: { completedLessons: ['m1', 'm2'], reviewQueue: [] } },
    }))
    const p = loadProgress()
    expect(p.completedLessons).toEqual(['m1', 'm2'])
  })
})
