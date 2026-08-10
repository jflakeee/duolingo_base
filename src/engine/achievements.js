export const ACHIEVEMENTS = [
  { id: 'first', label: '첫 걸음', desc: '첫 레슨 완료', icon: '🐣', test: (p) => p.completedLessons.length >= 1 },
  { id: 'lessons10', label: '성실한 학습자', desc: '레슨 10개 완료', icon: '📚', test: (p) => p.completedLessons.length >= 10 },
  { id: 'streak7', label: '일주일 개근', desc: '스트릭 7일', icon: '🔥', test: (p) => p.streak.count >= 7 },
  { id: 'xp500', label: 'XP 수집가', desc: '누적 500 XP', icon: '⭐', test: (p) => p.xp >= 500 },
  { id: 'perfect10', label: '완벽주의자', desc: '완벽한 레슨 10회', icon: '💎', test: (p) => (p.perfectCount || 0) >= 10 },
]

// ids of achievements whose condition is met but not yet recorded as unlocked
export function newlyUnlocked(progress) {
  const unlocked = progress.achievements || {}
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.test(progress)).map((a) => a.id)
}
