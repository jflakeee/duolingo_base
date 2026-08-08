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
})
