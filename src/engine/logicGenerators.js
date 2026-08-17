// 논리(logic) 과목 — 절차적 생성기. 순수 + 결정적(주입된 rng).
import { LOGIC_CATEGORIES, LOGIC_SYLLOGISMS, LOGIC_ANALOGIES, LOGIC_INFERENCES, LOGIC_ORDERINGS } from './logicData.js'

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

// 수열 완성: 산술·기하 규칙의 다음 항 고르기. 완전 생성(무한).
export function genSequenceMcq(rng) {
  const geometric = rng() < 0.35
  let terms, next
  if (geometric) {
    const start = 1 + Math.floor(rng() * 3) // 1..3
    const ratio = 2 + Math.floor(rng() * 2) // 2..3
    terms = [start, start * ratio, start * ratio ** 2, start * ratio ** 3]
    next = start * ratio ** 4
  } else {
    const start = 1 + Math.floor(rng() * 9) // 1..9
    const diff = 2 + Math.floor(rng() * 5) // 2..6
    terms = [start, start + diff, start + 2 * diff, start + 3 * diff]
    next = start + 4 * diff
  }
  // 오답: 근처 값 후보에서 정답과 겹치지 않게 3개(값 중복 제거).
  const raw = [next + 1, next - 1, next + 2, next - 2, next + 3, next - 3, next + 4, next + 5]
  const cand = [...new Set(raw.filter((v) => v !== next && v > 0))]
  const distractors = sampleDistinct(rng, cand, 3)
  const choices = shuffle(rng, [next, ...distractors].map(String))
  return { type: 'mcq', prompt: `다음에 올 수는?\n\n${terms.join(', ')}, ?`, choices, answer: String(next), _generated: true }
}

export function genOddOneOutMcq(rng) {
  const cat = pick(rng, LOGIC_CATEGORIES)
  const members = sampleDistinct(rng, cat.members, 3)
  const intruder = pick(rng, cat.intruders)
  return { type: 'mcq', prompt: '다른 하나를 고르세요.', choices: shuffle(rng, [...members, intruder]), answer: intruder, _generated: true }
}

export function genSyllogismMcq(rng) {
  const s = pick(rng, LOGIC_SYLLOGISMS)
  return { type: 'mcq', prompt: `다음에서 올바른 결론은?\n\n${s.premises}`, choices: shuffle(rng, [s.answer, ...s.distractors.slice(0, 3)]), answer: s.answer, _generated: true }
}

export function genAnalogyMcq(rng) {
  const a = pick(rng, LOGIC_ANALOGIES)
  return { type: 'mcq', prompt: `관계에 맞는 말은?\n\n${a.a} : ${a.b} = ${a.c} : ?`, choices: shuffle(rng, [a.answer, ...a.distractors.slice(0, 3)]), answer: a.answer, _generated: true }
}

export function genInferenceReading(rng) {
  const r = pick(rng, LOGIC_INFERENCES)
  return { type: 'reading', passage: r.passage, prompt: r.prompt, choices: shuffle(rng, [...r.choices]), answer: r.answer, _generated: true }
}

export function genLogicOrder(rng) {
  const o = pick(rng, LOGIC_ORDERINGS)
  let items = shuffle(rng, o.answer)
  if (items.every((v, i) => v === o.answer[i]) && o.answer.length > 1) items = [...o.answer].reverse()
  return { type: 'order', prompt: o.prompt, items, answer: [...o.answer], _generated: true }
}

// levelId → 생성기 밴드(학교 단계별).
function band(levelId) {
  if (['kinder', 'grade1', 'grade2'].includes(levelId)) return [genSequenceMcq, genOddOneOutMcq, genLogicOrder]
  if (['grade3', 'grade4', 'grade5', 'grade6'].includes(levelId)) return [genSequenceMcq, genOddOneOutMcq, genAnalogyMcq, genInferenceReading, genLogicOrder]
  if (['middle1', 'middle2', 'middle3'].includes(levelId)) return [genSequenceMcq, genAnalogyMcq, genSyllogismMcq, genInferenceReading, genLogicOrder]
  return [genSyllogismMcq, genInferenceReading, genAnalogyMcq, genSequenceMcq, genLogicOrder]
}

export function hasLogicGenerators() { return true }

export function generateLogicForLevel(levelId, rng, count) {
  if (!levelId || count <= 0) return []
  const gens = band(levelId)
  const order = shuffle(rng, gens.map((_, i) => i))
  const out = []
  for (let i = 0; i < count; i++) out.push(gens[order[i % order.length]](rng))
  return out
}
