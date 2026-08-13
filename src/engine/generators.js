// Procedural exercise generators — genuinely new problems at a controlled difficulty.
// Pure + deterministic given an injected rng. Early levels only; higher levels fall back
// to pool sampling (see practice.js). Every generated item satisfies the same invariants
// as hand-authored content (mcq/picture: 4 distinct choices, answer ∈ choices).

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

// ---- vocab pools ({ word, ko, emoji }) ----
export const POOLS = {
  colors: [
    { word: 'red', ko: '빨강', emoji: '🔴' }, { word: 'blue', ko: '파랑', emoji: '🔵' },
    { word: 'green', ko: '초록', emoji: '🟢' }, { word: 'yellow', ko: '노랑', emoji: '🟡' },
    { word: 'orange', ko: '주황', emoji: '🟠' }, { word: 'purple', ko: '보라', emoji: '🟣' },
    { word: 'black', ko: '검정', emoji: '⚫' }, { word: 'white', ko: '흰색', emoji: '⚪' },
  ],
  animals: [
    { word: 'cat', ko: '고양이', emoji: '🐱' }, { word: 'dog', ko: '개', emoji: '🐶' },
    { word: 'fish', ko: '물고기', emoji: '🐟' }, { word: 'bird', ko: '새', emoji: '🐤' },
    { word: 'rabbit', ko: '토끼', emoji: '🐰' }, { word: 'bear', ko: '곰', emoji: '🐻' },
    { word: 'lion', ko: '사자', emoji: '🦁' }, { word: 'mouse', ko: '쥐', emoji: '🐭' },
  ],
  food: [
    { word: 'apple', ko: '사과', emoji: '🍎' }, { word: 'bread', ko: '빵', emoji: '🍞' },
    { word: 'milk', ko: '우유', emoji: '🥛' }, { word: 'rice', ko: '밥', emoji: '🍚' },
    { word: 'egg', ko: '달걀', emoji: '🥚' }, { word: 'banana', ko: '바나나', emoji: '🍌' },
    { word: 'grape', ko: '포도', emoji: '🍇' }, { word: 'cake', ko: '케이크', emoji: '🍰' },
  ],
  family: [
    { word: 'mother', ko: '엄마', emoji: '👩' }, { word: 'father', ko: '아빠', emoji: '👨' },
    { word: 'baby', ko: '아기', emoji: '👶' }, { word: 'sister', ko: '누나', emoji: '👧' },
    { word: 'brother', ko: '형', emoji: '👦' }, { word: 'grandmother', ko: '할머니', emoji: '👵' },
    { word: 'grandfather', ko: '할아버지', emoji: '👴' },
  ],
  weather: [
    { word: 'sunny', ko: '맑음', emoji: '☀️' }, { word: 'rainy', ko: '비', emoji: '🌧️' },
    { word: 'snowy', ko: '눈', emoji: '❄️' }, { word: 'cloudy', ko: '흐림', emoji: '⛅' },
    { word: 'windy', ko: '바람', emoji: '🌬️' }, { word: 'rainbow', ko: '무지개', emoji: '🌈' },
    { word: 'stormy', ko: '폭풍', emoji: '⛈️' }, { word: 'foggy', ko: '안개', emoji: '🌫️' },
  ],
  feelings: [
    { word: 'happy', ko: '행복한', emoji: '😀' }, { word: 'sad', ko: '슬픈', emoji: '😢' },
    { word: 'angry', ko: '화난', emoji: '😠' }, { word: 'scared', ko: '무서운', emoji: '😨' },
    { word: 'tired', ko: '피곤한', emoji: '😫' }, { word: 'surprised', ko: '놀란', emoji: '😲' },
    { word: 'sleepy', ko: '졸린', emoji: '😴' }, { word: 'excited', ko: '신나는', emoji: '🤩' },
  ],
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

// levelId → generator thunks (each takes rng → exercise)
export const LEVEL_GENERATORS = {
  kinder: [
    (r) => genNumberTypein(r, 10), (r) => genNumberMcq(r, 10),
    (r) => genVocabPicture(r, POOLS.colors), (r) => genVocabMcq(r, POOLS.colors),
    (r) => genVocabPicture(r, POOLS.animals), (r) => genVocabMcq(r, POOLS.animals),
    (r) => genVocabPicture(r, POOLS.food),
  ],
  grade1: [
    (r) => genNumberTypein(r, 20), (r) => genNumberMcq(r, 20),
    (r) => genVocabPicture(r, POOLS.family), (r) => genVocabMcq(r, POOLS.family), (r) => genVocabTypein(r, POOLS.family),
    (r) => genVocabMcq(r, POOLS.animals),
  ],
  grade2: [
    (r) => genVocabPicture(r, POOLS.weather), (r) => genVocabMcq(r, POOLS.weather),
    (r) => genVocabPicture(r, POOLS.feelings), (r) => genVocabMcq(r, POOLS.feelings), (r) => genVocabTypein(r, POOLS.feelings),
    (r) => genNumberMcq(r, 20),
  ],
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
