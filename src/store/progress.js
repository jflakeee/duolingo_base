import { START_HEARTS } from '../engine/gamification.js'

export const STORAGE_KEY = 'lingoduck.progress.v1'

export function defaultProgress() {
  return {
    version: 2,
    xp: 0,
    hearts: START_HEARTS,
    heartsUpdatedAt: 0,
    streak: { count: 0, lastDay: null, freezes: 1 },
    completedLessons: [],
    dailyXp: { day: null, amount: 0 },
    gems: 0,
    dailyGoal: 50,
    onboarded: false,
    settings: { theme: 'auto' },
    quests: { day: null, items: [] },
    achievements: {},
    perfectCount: 0,
    reviewQueue: [],
    memberId: '',
    role: 'learner',
    google: null,
    children: [],
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    return { ...defaultProgress(), ...JSON.parse(raw) }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY)
}
