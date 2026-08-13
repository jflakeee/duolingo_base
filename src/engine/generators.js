// Procedural exercise generators — genuinely new problems at a controlled difficulty.
// Pure + deterministic given an injected rng. Early levels only; higher levels fall back
// to pool sampling (see practice.js). Every generated item satisfies the same invariants
// as hand-authored content (mcq/picture: 4 distinct choices, answer ∈ choices).
import { POOLS, ANTONYMS, VERBS, SYNONYMS, BUSINESS } from './practiceData.js'
export { POOLS } // re-export for consumers/tests

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

export function numberWord(n) {
  if (n < 0 || n > 100) return String(n)
  if (n <= 20) return ONES[n]
  if (n === 100) return 'one hundred'
  const t = Math.floor(n / 10)
  const o = n % 10
  return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`
}

// Korean particle selection by final-jamo 받침 (batchim).
export function hasBatchim(ko) {
  const ch = String(ko).trim().slice(-1)
  const code = ch.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}
const topicP = (ko) => (hasBatchim(ko) ? '은' : '는') // 은/는
const objP = (ko) => (hasBatchim(ko) ? '을' : '를') // 을/를

function randInt(rng, n) { return Math.floor(rng() * n) }
function pick(rng, arr) { return arr[randInt(rng, arr.length)] }
function sampleDistinct(rng, arr, n, exclude) {
  const ex = new Set(exclude || [])
  const copy = arr.filter((x) => !ex.has(x))
  const out = []
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(randInt(rng, copy.length), 1)[0])
  return out
}
function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(rng, i + 1);[a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ---- number generators ----
export function genNumberTypein(rng, max = 10) {
  const n = 1 + randInt(rng, max)
  const w = numberWord(n)
  return { type: 'typein', prompt: `숫자 ${n} → 영어로 쓰기`, word: w, answer: w, audioText: w, _generated: true }
}
export function genNumberMcq(rng, max = 10) {
  const n = 1 + randInt(rng, max)
  const correct = numberWord(n)
  const allWords = Array.from({ length: max }, (_, i) => numberWord(i + 1))
  const distractors = sampleDistinct(rng, allWords, 3, [correct])
  return { type: 'mcq', prompt: `숫자 ${n} → 영어로?`, choices: shuffle(rng, [correct, ...distractors]), answer: correct, audioText: correct, _generated: true }
}

export function genVocabPicture(rng, pool) {
  const target = pick(rng, pool)
  const distractors = sampleDistinct(rng, pool.map((p) => p.emoji), 3, [target.emoji])
  return { type: 'picture', prompt: `${target.ko}${topicP(target.ko)} 어느 것?`, word: target.word, choices: shuffle(rng, [target.emoji, ...distractors]), answer: target.emoji, audioText: target.word, _generated: true }
}
export function genVocabMcq(rng, pool) {
  const target = pick(rng, pool)
  const distractors = sampleDistinct(rng, pool.map((p) => p.word), 3, [target.word])
  return { type: 'mcq', prompt: `'${target.ko}'${topicP(target.ko)} 영어로?`, choices: shuffle(rng, [target.word, ...distractors]), answer: target.word, audioText: target.word, _generated: true }
}
export function genVocabTypein(rng, pool) {
  const target = pick(rng, pool)
  return { type: 'typein', prompt: `'${target.ko}'${objP(target.ko)} 영어로 쓰세요`, word: target.word, answer: target.word, audioText: target.word, _generated: true }
}

// ---- grammar / higher-difficulty generators ----
export function genAntonymMcq(rng) {
  const p = pick(rng, ANTONYMS)
  const all = ANTONYMS.flatMap((a) => [a.word, a.opposite])
  const distractors = sampleDistinct(rng, all, 3, [p.word, p.opposite])
  return { type: 'mcq', prompt: `'${p.word}'(${p.ko})의 반대말은?`, choices: shuffle(rng, [p.opposite, ...distractors]), answer: p.opposite, audioText: p.opposite, _generated: true }
}
export function genVerbPastTypein(rng) {
  const v = pick(rng, VERBS)
  return { type: 'typein', prompt: `'${v.base}'(${v.ko})의 과거형을 쓰세요`, word: v.past, answer: v.past, audioText: v.past, _generated: true }
}
export function genVerbPastMcq(rng) {
  const v = pick(rng, VERBS)
  const distractors = sampleDistinct(rng, VERBS.map((x) => x.past), 3, [v.past])
  return { type: 'mcq', prompt: `'${v.base}'(${v.ko})의 과거형은?`, choices: shuffle(rng, [v.past, ...distractors]), answer: v.past, audioText: v.past, _generated: true }
}
export function genSynonymMcq(rng) {
  const s = pick(rng, SYNONYMS)
  const all = SYNONYMS.flatMap((x) => [x.word, x.synonym])
  const distractors = sampleDistinct(rng, all, 3, [s.word, s.synonym])
  return { type: 'mcq', prompt: `'${s.word}'(${s.ko})와 비슷한 말은?`, choices: shuffle(rng, [s.synonym, ...distractors]), answer: s.synonym, audioText: s.synonym, _generated: true }
}
export function genBusinessMcq(rng) {
  const b = pick(rng, BUSINESS)
  const distractors = sampleDistinct(rng, BUSINESS.map((x) => x.word), 3, [b.word])
  return { type: 'mcq', prompt: `'${b.ko}'${topicP(b.ko)} 영어로?`, choices: shuffle(rng, [b.word, ...distractors]), answer: b.word, audioText: b.word, _generated: true }
}
export function genBusinessTypein(rng) {
  const b = pick(rng, BUSINESS)
  return { type: 'typein', prompt: `'${b.ko}'${objP(b.ko)} 영어로 쓰세요`, word: b.word, answer: b.word, audioText: b.word, _generated: true }
}

// vocab-generator triples for a pool (picture + mcq + typein)
const vg = (key) => [(r) => genVocabPicture(r, POOLS[key]), (r) => genVocabMcq(r, POOLS[key]), (r) => genVocabTypein(r, POOLS[key])]

// levelId → generator thunks (each takes rng → exercise). Every level now generates.
export const LEVEL_GENERATORS = {
  kinder: [(r) => genNumberTypein(r, 10), (r) => genNumberMcq(r, 10), ...vg('colors'), ...vg('animals'), (r) => genVocabPicture(r, POOLS.food)],
  grade1: [(r) => genNumberTypein(r, 20), (r) => genNumberMcq(r, 20), ...vg('family'), (r) => genVocabMcq(r, POOLS.animals)],
  grade2: [...vg('weather'), ...vg('feelings'), (r) => genNumberMcq(r, 20)],
  grade3: [...vg('school'), ...vg('body'), (r) => genNumberMcq(r, 100), (r) => genAntonymMcq(r)],
  grade4: [...vg('clothes'), ...vg('jobs'), (r) => genAntonymMcq(r), (r) => genVerbPastMcq(r)],
  grade5: [...vg('sports'), ...vg('transport'), (r) => genVerbPastMcq(r), (r) => genAntonymMcq(r)],
  grade6: [...vg('nature'), ...vg('house'), (r) => genSynonymMcq(r), (r) => genVerbPastTypein(r)],
  middle1: [(r) => genAntonymMcq(r), (r) => genVerbPastMcq(r), (r) => genVerbPastTypein(r), (r) => genSynonymMcq(r)],
  middle2: [(r) => genVerbPastMcq(r), (r) => genVerbPastTypein(r), (r) => genSynonymMcq(r), (r) => genAntonymMcq(r)],
  middle3: [(r) => genSynonymMcq(r), (r) => genVerbPastMcq(r), (r) => genAntonymMcq(r), (r) => genVerbPastTypein(r)],
  high1: [(r) => genSynonymMcq(r), (r) => genAntonymMcq(r), (r) => genVerbPastMcq(r)],
  high2: [(r) => genSynonymMcq(r), (r) => genVerbPastMcq(r), (r) => genAntonymMcq(r)],
  high3: [(r) => genSynonymMcq(r), (r) => genVerbPastTypein(r), (r) => genAntonymMcq(r)],
  uni1: [(r) => genSynonymMcq(r), (r) => genBusinessMcq(r), (r) => genAntonymMcq(r)],
  uni2: [(r) => genBusinessMcq(r), (r) => genSynonymMcq(r), (r) => genBusinessTypein(r)],
  uni3: [(r) => genBusinessMcq(r), (r) => genSynonymMcq(r), (r) => genBusinessTypein(r)],
  uni4: [(r) => genBusinessMcq(r), (r) => genBusinessTypein(r), (r) => genSynonymMcq(r)],
  work1: [(r) => genBusinessMcq(r), (r) => genBusinessTypein(r), (r) => genSynonymMcq(r)],
  work2: [(r) => genBusinessMcq(r), (r) => genBusinessTypein(r), (r) => genSynonymMcq(r)],
  work3: [(r) => genBusinessMcq(r), (r) => genBusinessTypein(r), (r) => genSynonymMcq(r)],
}

export function hasGenerators(levelId) {
  return !!LEVEL_GENERATORS[levelId]
}

export function generateForLevel(levelId, rng, count) {
  const gens = LEVEL_GENERATORS[levelId]
  if (!gens || count <= 0) return []
  const order = shuffle(rng, gens.map((_, i) => i))
  const out = []
  for (let i = 0; i < count; i++) out.push(gens[order[i % order.length]](rng))
  return out
}
