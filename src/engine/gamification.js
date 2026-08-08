export const START_HEARTS = 5
export const XP_CORRECT = 10
export const XP_PERFECT_BONUS = 20
export const DAILY_GOAL = 50

export function loseHeart(hearts) {
  return Math.max(0, hearts - 1)
}

export function xpForLesson({ correct, mistakes }) {
  const base = correct * XP_CORRECT
  return mistakes === 0 ? base + XP_PERFECT_BONUS : base
}

// 'YYYY-MM-DD' difference in whole days (b - a).
function dayDiff(a, b) {
  const ms = Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')
  return Math.round(ms / 86400000)
}

export function updateStreak(streak, today) {
  const { count, lastDay, freezes } = streak
  if (lastDay === null) return { count: 1, lastDay: today, freezes }
  const diff = dayDiff(lastDay, today)
  if (diff <= 0) return streak // same day (or earlier): no change
  if (diff === 1) return { count: count + 1, lastDay: today, freezes }
  if (diff === 2 && freezes > 0) return { count: count + 1, lastDay: today, freezes: freezes - 1 }
  return { count: 1, lastDay: today, freezes }
}

export function addDailyXp(daily, gained, today) {
  if (daily.day === today) return { day: today, amount: daily.amount + gained }
  return { day: today, amount: gained }
}
