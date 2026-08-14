// Math subject — procedural generators. Numeric answers graded via typein (string compare).
// Pure + deterministic given an injected rng. Bands keyed by curriculum level id.

function ri(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)) } // inclusive
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }
function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}
const T = (prompt, answer, accept) => ({ type: 'typein', prompt, answer: String(answer), ...(accept ? { accept } : {}), _generated: true })

// numeric mcq: answer + 3 distinct near distractors
function numMcq(rng, prompt, answer) {
  const set = new Set([answer])
  let guard = 0
  while (set.size < 4 && guard++ < 50) {
    const d = answer + ri(rng, -Math.max(2, Math.abs(answer)), Math.max(2, Math.abs(answer)))
    if (d !== answer) set.add(d)
  }
  const choices = shuffle(rng, [...set].slice(0, 4)).map(String)
  return { type: 'mcq', prompt, choices, answer: String(answer), _generated: true }
}

// ---- operation generators (each → exercise) ----
const ops = {
  add: (rng, b) => { const x = ri(rng, 1, b.max), y = ri(rng, 1, b.max); return b.mcq ? numMcq(rng, `${x} + ${y} = ?`, x + y) : T(`${x} + ${y} = ?`, x + y) },
  sub: (rng, b) => { const x = ri(rng, 1, b.max), y = ri(rng, 0, x); return b.mcq ? numMcq(rng, `${x} − ${y} = ?`, x - y) : T(`${x} − ${y} = ?`, x - y) },
  mul: (rng, b) => { const x = ri(rng, 2, b.mulMax || 9), y = ri(rng, 2, b.mulMax || 9); return b.mcq ? numMcq(rng, `${x} × ${y} = ?`, x * y) : T(`${x} × ${y} = ?`, x * y) },
  div: (rng, b) => { const y = ri(rng, 2, b.mulMax || 9), q = ri(rng, 2, b.mulMax || 9); return T(`${y * q} ÷ ${y} = ?`, q) },
  fractionOfQty: (rng) => { const d = pick(rng, [2, 3, 4, 5]), q = d * ri(rng, 1, 6); return T(`${q}의 1/${d}은?`, q / d) },
  percent: (rng) => { const p = pick(rng, [10, 20, 25, 50]), base = ri(rng, 1, 20) * (p === 25 ? 4 : 10); return T(`${base}의 ${p}%는?`, Math.round(base * p / 100)) },
  area: (rng) => { const w = ri(rng, 2, 12), h = ri(rng, 2, 12); return T(`가로 ${w}, 세로 ${h}인 직사각형의 넓이는?`, w * h) },
  perimeter: (rng) => { const w = ri(rng, 2, 12), h = ri(rng, 2, 12); return T(`가로 ${w}, 세로 ${h}인 직사각형의 둘레는?`, 2 * (w + h)) },
  negative: (rng) => { const x = ri(rng, 1, 10), y = ri(rng, x + 1, x + 10); return T(`${x} − ${y} = ?`, x - y) },
  equation: (rng) => {
    const kind = ri(rng, 0, 2)
    if (kind === 0) { const a = ri(rng, 1, 9), s = ri(rng, 1, 9); return T(`x + ${a} = ${a + s}, x = ?`, s) }
    if (kind === 1) { const a = ri(rng, 1, 9), s = ri(rng, 1, 9); return T(`x − ${a} = ${s}, x = ?`, s + a) }
    const c = ri(rng, 2, 6), s = ri(rng, 1, 9); return T(`${c}x = ${c * s}, x = ?`, s)
  },
  exponent: (rng) => { const base = ri(rng, 2, 6), e = ri(rng, 2, 3); return T(`${base}의 ${e}제곱은?`, base ** e) },
  sqrt: (rng) => { const r = ri(rng, 2, 12); return T(`√${r * r} = ?`, r) },
  sequence: (rng) => { const start = ri(rng, 1, 9), step = ri(rng, 2, 5); const seq = [0, 1, 2, 3].map((i) => start + i * step); return T(`${seq.join(', ')}, 다음 수는?`, start + 4 * step) },
}

// levelId → band config { list: opName[], max, mulMax, mcq }
const BANDS = {
  kinder: { list: ['add', 'sub'], max: 10, mcq: true },
  grade1: { list: ['add', 'sub'], max: 20, mcq: true },
  grade2: { list: ['add', 'sub', 'mul'], max: 100, mulMax: 5 },
  grade3: { list: ['mul', 'div', 'add', 'sub'], max: 100, mulMax: 9 },
  grade4: { list: ['mul', 'div', 'fractionOfQty', 'area'], max: 1000, mulMax: 12 },
  grade5: { list: ['fractionOfQty', 'percent', 'area', 'perimeter'], max: 1000, mulMax: 12 },
  grade6: { list: ['percent', 'area', 'perimeter', 'div'], max: 1000, mulMax: 12 },
  middle1: { list: ['equation', 'negative', 'mul'], max: 20, mulMax: 12 },
  middle2: { list: ['equation', 'exponent', 'negative'], max: 20 },
  middle3: { list: ['equation', 'sqrt', 'exponent'], max: 20 },
  high1: { list: ['equation', 'exponent', 'sequence'], max: 20 },
  high2: { list: ['equation', 'sqrt', 'sequence'], max: 20 },
  high3: { list: ['equation', 'exponent', 'sequence'], max: 20 },
  uni1: { list: ['percent', 'equation', 'sequence'], max: 20 },
  uni2: { list: ['percent', 'equation', 'exponent'], max: 20 },
  uni3: { list: ['percent', 'equation', 'sequence'], max: 20 },
  uni4: { list: ['percent', 'equation', 'sqrt'], max: 20 },
  work1: { list: ['percent', 'equation', 'mul'], max: 100, mulMax: 12 },
  work2: { list: ['percent', 'div', 'mul'], max: 100, mulMax: 12 },
  work3: { list: ['percent', 'equation', 'sequence'], max: 100, mulMax: 12 },
}

export function hasMathGenerators(levelId) { return !!BANDS[levelId] }

export function generateMathForLevel(levelId, rng, count) {
  const band = BANDS[levelId]
  if (!band || count <= 0) return []
  const order = shuffle(rng, band.list.map((_, i) => i))
  const out = []
  for (let i = 0; i < count; i++) out.push(ops[band.list[order[i % order.length]]](rng, band))
  return out
}

export { BANDS as MATH_BANDS }
