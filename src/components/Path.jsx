import { getLevels } from '../data/loadCurriculum.js'

export default function Path({ progress, onStart }) {
  const done = new Set(progress.completedLessons)
  const seq = []
  getLevels().forEach((lvl) => lvl.units.forEach((u) => u.lessons.forEach((l) => seq.push(l.id))))

  function isLocked(lessonId) {
    const idx = seq.indexOf(lessonId)
    if (idx <= 0) return false
    return !done.has(seq[idx - 1]) // unlocked when previous lesson done
  }

  return (
    <div>
      {getLevels().map((lvl) => (
        <section key={lvl.id} style={{ marginBottom: 20 }}>
          <h2>{lvl.name}</h2>
          {lvl.units.map((u) => (
            <div key={u.id} style={{ marginBottom: 12 }}>
              <h3 style={{ color: 'var(--muted)' }}>{u.title}</h3>
              {u.lessons.map((l) => {
                const locked = isLocked(l.id)
                const complete = done.has(l.id)
                return (
                  <button key={l.id} className="choice" disabled={locked}
                    onClick={() => onStart(l.id)}>
                    {complete ? '✅ ' : locked ? '🔒 ' : '▶️ '}{l.title}
                  </button>
                )
              })}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
