import { getLevels } from '../data/loadCurriculum.js'
import Duck from './Duck.jsx'

// gentle left/right sway for the winding path
const SWAY = [0, 46, 64, 46, 0, -46, -64, -46]

export default function Path({ progress, onStart }) {
  const done = new Set(progress.completedLessons)
  const seq = []
  getLevels().forEach((lvl) => lvl.units.forEach((u) => u.lessons.forEach((l) => seq.push(l.id))))

  function isLocked(lessonId) {
    const idx = seq.indexOf(lessonId)
    if (idx <= 0) return false
    return !done.has(seq[idx - 1]) // unlocked when previous lesson done
  }

  const totalDone = progress.completedLessons.length

  return (
    <div>
      <div className="path-hero">
        <Duck mood="cheer" size={64} bob />
        <div>
          <p>안녕! 나는 덕이 🦆</p>
          <p className="sub">
            {totalDone === 0 ? '첫 레슨부터 시작해요!' : `지금까지 레슨 ${totalDone}개 완료 · 계속 가요!`}
          </p>
        </div>
      </div>

      {getLevels().map((lvl, li) => {
        const lessonCount = lvl.units.reduce((n, u) => n + u.lessons.length, 0)
        return (
          <section key={lvl.id} className={`level level--${li % 3}`}>
            <div className="level__head">
              <h2>{lvl.name}</h2>
              <span className="sub">{lvl.units.length}유닛 · {lessonCount}레슨</span>
            </div>

            {lvl.units.map((u) => (
              <div key={u.id} className="unit">
                <div className="unit__title">{u.title}</div>
                <div className="nodes">
                  {u.lessons.map((l, i) => {
                    const complete = done.has(l.id)
                    const locked = isLocked(l.id)
                    const current = !complete && !locked
                    const state = complete ? 'done' : locked ? 'locked' : 'current'
                    const icon = complete ? '✓' : locked ? '🔒' : '▶'
                    return (
                      <button
                        key={l.id}
                        className={`node node--${state}`}
                        disabled={locked}
                        onClick={() => onStart(l.id)}
                        style={{ transform: `translateX(${SWAY[i % SWAY.length]}px)` }}
                      >
                        {current && <span className="node__bubble">시작</span>}
                        <span className="node__disc" aria-hidden="true">{icon}</span>
                        <span className="node__label">{l.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
