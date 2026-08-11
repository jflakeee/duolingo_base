import { getLevels } from '../data/loadCurriculum.js'
import Duck from './Duck.jsx'

// horizontal sway as a PERCENT of container width (aligns with the SVG viewBox x-units)
const SWAY = [0, 14, 20, 14, 0, -14, -20, -14]
const PITCH = 116 // px per node row
const DISC_CY = 40 // disc center offset from node top (px)

function cx(i) { return 50 + SWAY[i % SWAY.length] }
function cy(i) { return i * PITCH + DISC_CY }

// build one smooth cubic-bezier path string through the node centers
function roadPath(n) {
  let d = `M ${cx(0)} ${cy(0)}`
  for (let i = 1; i < n; i++) {
    const ymid = (cy(i - 1) + cy(i)) / 2
    d += ` C ${cx(i - 1)} ${ymid} ${cx(i)} ${ymid} ${cx(i)} ${cy(i)}`
  }
  return d
}

// green path only for segments whose earlier lesson is done
function donePath(lessons, done) {
  const n = lessons.length
  let d = ''
  for (let i = 1; i < n; i++) {
    if (done.has(lessons[i - 1].id)) {
      const ymid = (cy(i - 1) + cy(i)) / 2
      d += `M ${cx(i - 1)} ${cy(i - 1)} C ${cx(i - 1)} ${ymid} ${cx(i)} ${ymid} ${cx(i)} ${cy(i)} `
    }
  }
  return d.trim()
}

export default function Path({ progress, onStart, onReview }) {
  const done = new Set(progress.completedLessons)
  const seq = []
  getLevels().forEach((lvl) => lvl.units.forEach((u) => u.lessons.forEach((l) => seq.push(l.id))))
  const isLocked = (id) => {
    const idx = seq.indexOf(id)
    return idx > 0 && !done.has(seq[idx - 1])
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

      {(() => {
        const reviewCount = (progress.reviewQueue ?? []).length
        const canReview = reviewCount > 0 || progress.completedLessons.length > 0
        return (
          <button className="review-btn" disabled={!canReview} onClick={onReview}>
            🔄 복습하기{reviewCount > 0 && <span className="review-badge">{reviewCount}</span>}
          </button>
        )
      })()}

      {getLevels().map((lvl, li) => {
        const lessonCount = lvl.units.reduce((n, u) => n + u.lessons.length, 0)
        return (
          <section key={lvl.id} className={`level level--${li % 3}`}>
            <div className="level__head">
              <h2>{lvl.name}</h2>
              <span className="sub">{lvl.units.length}유닛 · {lessonCount}레슨</span>
            </div>

            {lvl.units.map((u) => {
              const n = u.lessons.length
              const height = (n - 1) * PITCH + 96
              return (
                <div key={u.id} className="unit">
                  <div className="unit__title">{u.title}</div>
                  <div className="nodes" style={{ height }}>
                    <svg
                      className="nodes__road"
                      viewBox={`0 0 100 ${height}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path className="road road--bg" d={roadPath(n)} />
                      <path className="road road--done" d={donePath(u.lessons, done)} />
                    </svg>
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
                          style={{ top: i * PITCH, left: `${cx(i)}%` }}
                        >
                          {current && <span className="node__bubble">시작</span>}
                          <span className="node__disc" aria-hidden="true">{icon}</span>
                          <span className="node__label">{l.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
