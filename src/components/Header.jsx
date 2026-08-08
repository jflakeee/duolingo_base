import { DAILY_GOAL } from '../engine/gamification.js'

export default function Header({ progress }) {
  const goalPct = Math.min(100, Math.round((progress.dailyXp.amount / DAILY_GOAL) * 100))
  return (
    <div className="header">
      <span>❤️ {progress.hearts}</span>
      <span>🔥 {progress.streak.count}</span>
      <span>⭐ {progress.xp} XP</span>
      <div className="progress" style={{ flex: 1 }}>
        <i style={{ width: `${goalPct}%` }} />
      </div>
    </div>
  )
}
