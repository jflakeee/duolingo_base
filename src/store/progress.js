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
    messages: [],
    // v3: multi-subject. Top-level completedLessons/reviewQueue mirror the active subject.
    activeSubject: 'english',
    subjects: { english: { completedLessons: [], reviewQueue: [] } },
    // custom '내 문제집' 덱(콘텐츠). subjects.custom가 진도.
    decks: [],
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw)
    const p = { ...defaultProgress(), ...parsed }
    // v2→v3 migration: seed the subject map from the old top-level progress.
    if (!parsed.subjects) {
      p.subjects = { english: { completedLessons: p.completedLessons || [], reviewQueue: p.reviewQueue || [] } }
      p.activeSubject = 'english'
    }
    // Keep top-level completedLessons/reviewQueue synced to the active subject.
    const active = p.activeSubject || 'english'
    const sub = p.subjects[active] || { completedLessons: [], reviewQueue: [] }
    p.completedLessons = sub.completedLessons || []
    p.reviewQueue = sub.reviewQueue || []
    return p
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
