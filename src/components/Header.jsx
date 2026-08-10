import { DAILY_GOAL } from '../engine/gamification.js'

export default function Header({ progress }) {
  const goalPct = Math.min(100, Math.round((progress.dailyXp.amount / DAILY_GOAL) * 100))
  return (
    <div className="header">
      <span className="stat stat--heart"><span className="ico">❤️</span>{progress.hearts}</span>
      <span className="stat stat--streak"><span className="ico">🔥</span>{progress.streak.count}</span>
      <span className="stat stat--xp"><span className="ico">⭐</span>{progress.xp} XP</span>
      <span className="stat stat--gem"><span className="ico">💎</span>{progress.gems}</span>
      <div className="progress" title={`오늘 목표 ${progress.dailyXp.amount}/${DAILY_GOAL} XP`}>
        <i style={{ width: `${goalPct}%` }} />
      </div>
    </div>
  )
}
