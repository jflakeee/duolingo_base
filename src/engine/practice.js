// "오늘의 연습" — build a daily-varied session at a chosen difficulty level.
// Pure + deterministic (seeded by date), so a given day is stable but days differ.

export function dailySeed(dateStr, salt = '') {
  const s = `${dateStr}#${salt}`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32 PRNG → () => [0,1)
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleSeeded(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function levelExercises(level) {
  const out = []
  for (const u of level.units || []) {
    for (const l of u.lessons || []) {
      for (const ex of l.exercises || []) out.push(ex)
    }
  }
  return out
}

// mcq/picture: shuffle the visible choice order (answer is compared by value → safe).
export function varyChoices(ex, rng) {
  if ((ex.type === 'mcq' || ex.type === 'picture') && Array.isArray(ex.choices)) {
    return { ...ex, choices: shuffleSeeded(ex.choices, rng) }
  }
  return ex
}

// Returns a session of `size` exercises tagged _practice. Generated items are guaranteed
// included (up to size); the remainder is a seed-shuffled, choice-varied sample of the pool.
export function buildDailyPractice(level, dateStr, { size = 10, rng, generated = [] } = {}) {
  const r = rng || mulberry32(dailySeed(dateStr, level?.id || ''))
  const genPart = generated.slice(0, size)
  const need = size - genPart.length
  const pool = shuffleSeeded(levelExercises(level).map((ex) => varyChoices(ex, r)), r).slice(0, need)
  return shuffleSeeded([...genPart, ...pool], r).map((ex) => ({ ...ex, _practice: true }))
}
