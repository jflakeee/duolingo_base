import { START_HEARTS } from './gamification.js'

// 선물 카탈로그. cost는 젬(인앱 화폐) — 실제 돈 아님.
export const GIFT_ITEMS = [
  { id: 'hearts', label: '하트 가득', icon: '❤️', cost: 100 },
  { id: 'freeze', label: '스트릭 프리즈', icon: '🧊', cost: 150 },
  { id: 'gems50', label: '젬 50개', icon: '💎', cost: 60 },
]

export function giftItem(id) {
  return GIFT_ITEMS.find((g) => g.id === id) || null
}

const PREFIX = 'LDG1:'
function enc(obj) {
  return PREFIX + btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function encodeGift(gift) {
  return enc({ id: gift.id })
}
export function decodeGift(code) {
  if (typeof code !== 'string') return null
  const t = code.trim()
  if (!t.startsWith(PREFIX)) return null
  try {
    const s = t.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/')
    const obj = JSON.parse(atob(s + '='.repeat((4 - (s.length % 4)) % 4)))
    if (!giftItem(obj.id)) return null
    return { id: obj.id }
  } catch {
    return null
  }
}

// Apply a received gift to progress.
export function applyGift(progress, gift) {
  const it = giftItem(gift?.id)
  if (!it) return progress
  switch (gift.id) {
    case 'hearts':
      return { ...progress, hearts: START_HEARTS, heartsUpdatedAt: progress.heartsUpdatedAt }
    case 'freeze':
      return { ...progress, streak: { ...progress.streak, freezes: (progress.streak?.freezes || 0) + 1 } }
    case 'gems50':
      return { ...progress, gems: (progress.gems || 0) + 50 }
    default:
      return progress
  }
}

export function giftLabel(gift) {
  return giftItem(gift?.id)?.label || '선물'
}
