// Review-mode engine. Pure functions; UI wires them in App.
// Spaced repetition = Leitner boxes. reviewQueue item:
//   { key: "<lessonId>#<exIndex>", lessonId, ex, box, dueAt }
// box 0 = new/lapsed (due now); a correct answer promotes the box and pushes
// dueAt out by BOX_INTERVALS_MS[box]; a wrong answer resets to box 0 (due now).
// A correct answer at the last box masters the item and drops it from the queue.

const DAY = 24 * 60 * 60 * 1000
export const BOX_INTERVALS_MS = [1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY]

export function recordMistake(reviewQueue, item, now = 0) {
  if (reviewQueue.some((q) => q.key === item.key)) return reviewQueue
  return [...reviewQueue, { ...item, box: 0, dueAt: now }]
}

// Promote solved keys, reset wrong keys, drop mastered items. Untouched keys pass through.
export function applyReviewResult(reviewQueue, solvedKeys, wrongKeys, now = 0) {
  const solved = new Set(solvedKeys)
  const wrong = new Set(wrongKeys)
  const out = []
  for (const q of reviewQueue) {
    if (wrong.has(q.key)) {
      out.push({ ...q, box: 0, dueAt: now })
    } else if (solved.has(q.key)) {
      const nextBox = (q.box ?? 0) + 1
      if (nextBox > BOX_INTERVALS_MS.length) continue // mastered → drop
      out.push({ ...q, box: nextBox, dueAt: now + BOX_INTERVALS_MS[nextBox - 1] })
    } else {
      out.push(q)
    }
  }
  return out
}

export function dueCount(reviewQueue, now = 0) {
  return reviewQueue.filter((q) => (q.dueAt ?? 0) <= now).length
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
// Due mistakes (dueAt <= now) come first, weakest box first; the rest is filler
// drawn randomly from completed lessons.
export function buildReviewSession(
  { reviewQueue, completedLessons },
  lessonsById,
  { limit = 12, rng = Math.random, now = 0 } = {},
) {
  const due = reviewQueue
    .filter((q) => (q.dueAt ?? 0) <= now)
    .sort((a, b) => (a.box ?? 0) - (b.box ?? 0) || (a.dueAt ?? 0) - (b.dueAt ?? 0))
  const mistakes = due.slice(0, limit).map((q) => ({ ...q.ex, _reviewKey: q.key }))
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
