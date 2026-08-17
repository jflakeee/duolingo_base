// Korean subject — procedural generators. Pure + deterministic given an injected rng.
import { KO_ANTONYMS, KO_SYNONYMS, KO_SPELLING, KO_SENTENCES } from './koreanData.js'

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }
function sampleDistinct(rng, arr, n, exclude) {
  const ex = new Set(exclude || [])
  const copy = arr.filter((x) => !ex.has(x))
  const out = []
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0])
  return out
}
function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

export function genKoAntonymMcq(rng) {
  const p = pick(rng, KO_ANTONYMS)
  const all = KO_ANTONYMS.flatMap((a) => [a.word, a.opposite])
  const distractors = sampleDistinct(rng, all, 3, [p.word, p.opposite])
  return { type: 'mcq', prompt: `'${p.word}'의 반대말은?`, choices: shuffle(rng, [p.opposite, ...distractors]), answer: p.opposite, _generated: true }
}
export function genKoSynonymMcq(rng) {
  const s = pick(rng, KO_SYNONYMS)
  const all = KO_SYNONYMS.flatMap((x) => [x.word, x.synonym])
  const distractors = sampleDistinct(rng, all, 3, [s.word, s.synonym])
  return { type: 'mcq', prompt: `'${s.word}'와 비슷한 말은?`, choices: shuffle(rng, [s.synonym, ...distractors]), answer: s.synonym, _generated: true }
}
export function genKoSpellingMcq(rng) {
  const s = pick(rng, KO_SPELLING)
  return { type: 'mcq', prompt: '바른 표기를 고르세요.', choices: shuffle(rng, [s.correct, ...s.wrongs.slice(0, 3)]), answer: s.correct, _generated: true }
}
export function genKoDictation(rng) {
  const sent = pick(rng, KO_SENTENCES)
  return { type: 'dictation', prompt: '들리는 문장을 받아쓰세요', answer: sent, audioText: sent, lang: 'ko-KR', _generated: true }
}

// levelId → generator thunks. Every level generates (band by school stage).
function band(levelId) {
  if (['kinder', 'grade1', 'grade2'].includes(levelId)) return [genKoAntonymMcq, genKoSynonymMcq, genKoDictation]
  if (['grade3', 'grade4', 'grade5', 'grade6'].includes(levelId)) return [genKoAntonymMcq, genKoSynonymMcq, genKoSpellingMcq, genKoDictation]
  return [genKoSpellingMcq, genKoSynonymMcq, genKoAntonymMcq, genKoDictation]
}

export function hasKoreanGenerators() { return true }

export function generateKoreanForLevel(levelId, rng, count) {
  if (!levelId || count <= 0) return []
  const gens = band(levelId)
  const order = shuffle(rng, gens.map((_, i) => i))
  const out = []
  for (let i = 0; i < count; i++) out.push(gens[order[i % order.length]](rng))
  return out
}
