export const QUEST_DEFS = [
  { id: 'xp', type: 'earnXp', target: 30, reward: 10, label: '오늘 30 XP 벌기' },
  { id: 'lessons', type: 'lessons', target: 3, reward: 10, label: '레슨 3개 완료' },
  { id: 'perfect', type: 'perfect', target: 1, reward: 15, label: '완벽한 레슨 1개' },
]

export function makeDailyQuests(day) {
  return {
    day,
    items: QUEST_DEFS.map((q) => ({
      id: q.id, type: q.type, target: q.target, reward: q.reward, label: q.label,
      progress: 0, claimed: false,
    })),
  }
}

export function ensureQuests(quests, today) {
  if (!quests || quests.day !== today || !quests.items || quests.items.length === 0) {
    return makeDailyQuests(today)
  }
  return quests
}

export function applyLessonToQuests(quests, { xpGained, perfect }) {
  const items = quests.items.map((q) => {
    let p = q.progress
    if (q.type === 'earnXp') p += xpGained
    if (q.type === 'lessons') p += 1
    if (q.type === 'perfect' && perfect) p += 1
    return { ...q, progress: Math.min(p, q.target) }
  })
  return { ...quests, items }
}

export function isComplete(item) {
  return item.progress >= item.target
}

export function claimQuest(quests, id) {
  const item = quests.items.find((q) => q.id === id)
  if (!item || !isComplete(item) || item.claimed) return { quests, reward: 0 }
  const items = quests.items.map((q) => (q.id === id ? { ...q, claimed: true } : q))
  return { quests: { ...quests, items }, reward: item.reward }
}
