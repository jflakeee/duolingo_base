// 논술(essay) 과목 — 절차적 생성기. 순수 + 결정적(주입된 rng).
import { ESSAY_CONNECTIVES, ESSAY_FALLACIES, ESSAY_TOPICS, ESSAY_READINGS, ESSAY_ORDERINGS } from './essayData.js'

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }
function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

export function genConnectiveMcq(rng) {
  const c = pick(rng, ESSAY_CONNECTIVES)
  return { type: 'mcq', prompt: `빈칸에 알맞은 말은?\n\n${c.sentence}`, choices: shuffle(rng, [c.answer, ...c.distractors.slice(0, 3)]), answer: c.answer, _generated: true }
}

export function genFallacyMcq(rng) {
  const f = pick(rng, ESSAY_FALLACIES)
  return { type: 'mcq', prompt: `다음에 나타난 논리적 오류는?\n\n"${f.example}"`, choices: shuffle(rng, [f.answer, ...f.distractors.slice(0, 3)]), answer: f.answer, _generated: true }
}

export function genTopicReading(rng) {
  const t = pick(rng, ESSAY_TOPICS)
  return { type: 'reading', passage: t.passage, prompt: '이 글의 주제문으로 알맞은 것은?', choices: shuffle(rng, [t.answer, ...t.distractors.slice(0, 3)]), answer: t.answer, _generated: true }
}

export function genReadingComp(rng) {
  const r = pick(rng, ESSAY_READINGS)
  return { type: 'reading', passage: r.passage, prompt: r.prompt, choices: shuffle(rng, [...r.choices]), answer: r.answer, _generated: true }
}

export function genOrder(rng) {
  const o = pick(rng, ESSAY_ORDERINGS)
  // items = 정답을 섞은 보기. 정답과 동일 순서가 나오지 않도록 최소 한 번 보장.
  let items = shuffle(rng, o.answer)
  if (items.every((v, i) => v === o.answer[i]) && o.answer.length > 1) {
    items = [...o.answer].reverse()
  }
  return { type: 'order', prompt: o.prompt, items, answer: [...o.answer], _generated: true }
}

// levelId → 생성기 목록(학교 단계별 밴드). 저학년일수록 쉬운 역량.
function band(levelId) {
  if (['kinder', 'grade1', 'grade2'].includes(levelId)) return [genConnectiveMcq, genReadingComp, genOrder]
  if (['grade3', 'grade4', 'grade5', 'grade6'].includes(levelId)) return [genConnectiveMcq, genTopicReading, genReadingComp, genOrder]
  if (['middle1', 'middle2', 'middle3'].includes(levelId)) return [genConnectiveMcq, genFallacyMcq, genTopicReading, genOrder]
  return [genFallacyMcq, genTopicReading, genReadingComp, genConnectiveMcq, genOrder]
}

export function hasEssayGenerators() { return true }

export function generateEssayForLevel(levelId, rng, count) {
  if (!levelId || count <= 0) return []
  const gens = band(levelId)
  const order = shuffle(rng, gens.map((_, i) => i))
  const out = []
  for (let i = 0; i < count; i++) out.push(gens[order[i % order.length]](rng))
  return out
}
