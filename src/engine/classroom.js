// Teacher view: aggregate + sort many student snapshots (same shape as children).

export function classroomSummary(students) {
  const list = students || []
  const n = list.length
  if (n === 0) return { count: 0, avgPct: 0, avgXp: 0, avgStreak: 0 }
  const sum = (k) => list.reduce((a, s) => a + (s[k] || 0), 0)
  return {
    count: n,
    avgPct: Math.round(sum('pct') / n),
    avgXp: Math.round(sum('xp') / n),
    avgStreak: Math.round(sum('streakCount') / n),
  }
}

export const SORT_KEYS = { pct: 'pct', xp: 'xp', streak: 'streakCount' }

// Sorted copy, descending by the chosen metric.
export function sortStudents(students, by = 'pct') {
  const key = SORT_KEYS[by] || 'pct'
  return [...(students || [])].sort((a, b) => (b[key] || 0) - (a[key] || 0))
}
