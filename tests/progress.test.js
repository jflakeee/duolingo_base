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
  it('migrates a v1 save by filling new fields', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, xp: 30 }))
    const p = loadProgress()
    expect(p.xp).toBe(30)
    expect(p.gems).toBe(0)
    expect(p.onboarded).toBe(false)
    expect(p.settings).toEqual({ theme: 'auto' })
  })
})
