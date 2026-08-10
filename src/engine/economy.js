import { START_HEARTS } from './gamification.js'

export const GEM_PER_LESSON = 2
export const GEM_PERFECT_BONUS = 3
export const PRICE_HEART_REFILL = 350
export const PRICE_STREAK_FREEZE = 200
export const MAX_FREEZES = 2

export function gemsForLesson({ mistakes }) {
  return GEM_PER_LESSON + (mistakes === 0 ? GEM_PERFECT_BONUS : 0)
}

export function buyHeartRefill(gems, hearts) {
  if (hearts >= START_HEARTS || gems < PRICE_HEART_REFILL) return { ok: false, gems, hearts }
  return { ok: true, gems: gems - PRICE_HEART_REFILL, hearts: START_HEARTS }
}

export function buyStreakFreeze(gems, freezes) {
  if (freezes >= MAX_FREEZES || gems < PRICE_STREAK_FREEZE) return { ok: false, gems, freezes }
  return { ok: true, gems: gems - PRICE_STREAK_FREEZE, freezes: freezes + 1 }
}
