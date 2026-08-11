// Review-mode engine. Pure functions; UI wires them in App.

// reviewQueue item: { key: "<lessonId>#<exIndex>", lessonId, ex }
export function recordMistake(reviewQueue, item) {
  if (reviewQueue.some((q) => q.key === item.key)) return reviewQueue
  return [...reviewQueue, item]
}

export function clearSolved(reviewQueue, solvedKeys) {
  const solved = new Set(solvedKeys)
  return reviewQueue.filter((q) => !solved.has(q.key))
}

// Fisher–Yates; deterministic when rng is injected.
function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Returns exercises tagged with _reviewKey (string for mistakes, null for filler).
export function buildReviewSession({ reviewQueue, completedLessons }, lessonsById, { limit = 12, rng = Math.random } = {}) {
  const mistakes = reviewQueue.slice(0, limit).map((q) => ({ ...q.ex, _reviewKey: q.key }))
  if (mistakes.length >= limit) return mistakes

  const usedKeys = new Set(reviewQueue.map((q) => q.key))
  const pool = []
  for (const lessonId of completedLessons) {
    const lesson = lessonsById[lessonId]
    if (!lesson) continue
    lesson.exercises.forEach((ex, i) => {
      const key = `${lessonId}#${i}`
      if (!usedKeys.has(key)) pool.push({ ...ex, _reviewKey: null })
    })
  }
  const filler = shuffle(pool, rng).slice(0, limit - mistakes.length)
  return [...mistakes, ...filler]
}
