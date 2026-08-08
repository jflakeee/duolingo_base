# Lingo Duck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an ad-free, original-branded English-learning web app that reproduces Duolingo's core gamified lesson loop (hearts, XP, streaks, 4 exercise types) as a React + Vite SPA with no backend.

**Architecture:** Pure-logic modules (`scoring`, `gamification`, `session`, `progress`) are framework-free and unit-tested with Vitest. React components render state and delegate all rules to those modules. Curriculum is a hand-authored static JSON. Progress persists to `localStorage`. Audio uses the browser Web Speech + WebAudio APIs (zero assets).

**Tech Stack:** React 18, Vite 5, Vitest + @testing-library/react, jsdom. No server, no external content APIs.

**Project root:** `C:\Users\a\orca\workspaces\lingoduck` (separate git repo, already initialized).

---

## File Structure

```
lingoduck/
  index.html
  package.json
  vite.config.js
  vitest.setup.js
  src/
    main.jsx                 # React entry
    App.jsx                  # screen router (path <-> lesson <-> result)
    styles.css               # global styles + palette tokens
    data/curriculum.json     # hand-authored seed content
    data/loadCurriculum.js   # typed accessors over curriculum.json
    engine/scoring.js        # per-type answer checking (pure)
    engine/gamification.js   # hearts/XP/streak rules (pure)
    engine/session.js        # lesson state machine + wrong-answer requeue (pure)
    store/progress.js        # localStorage load/save/reset (pure-ish)
    audio/tts.js             # SpeechSynthesis wrapper
    audio/sfx.js             # WebAudio correct/wrong beeps
    components/Header.jsx     # hearts + XP + streak bar
    components/Path.jsx       # level/unit/lesson tree with locking
    components/Duck.jsx       # inline-SVG mascot with mood
    components/Lesson.jsx     # session container + progress bar
    components/Result.jsx     # end-of-session summary
    components/exercises/Mcq.jsx
    components/exercises/WordBank.jsx
    components/exercises/Listen.jsx
    components/exercises/Match.jsx
  tests/
    scoring.test.js
    gamification.test.js
    session.test.js
    progress.test.js
    exercises.test.jsx
```

---

## Task 0: Scaffold Vite + React + Vitest

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.setup.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css`, `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules
dist
.DS_Store
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "lingoduck",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 3: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
  },
})
```

- [ ] **Step 4: Create `vitest.setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Lingo Duck</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/styles.css`**

```css
:root {
  --green: #58cc02;
  --green-dark: #46a302;
  --yellow: #ffc800;
  --red: #ff4b4b;
  --ink: #3c3c3c;
  --muted: #afafaf;
  --bg: #fff;
  --card: #f7f7f7;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: var(--bg); }
button { font: inherit; cursor: pointer; }
.app { max-width: 480px; margin: 0 auto; min-height: 100vh; padding: 12px; }
.btn { border: none; border-radius: 14px; padding: 14px; font-weight: 700; width: 100%;
  background: var(--green); color: #fff; box-shadow: 0 4px 0 var(--green-dark); }
.btn:disabled { background: var(--muted); box-shadow: none; }
.btn-ghost { background: var(--card); color: var(--ink); box-shadow: 0 4px 0 #e0e0e0; }
.choice { border: 2px solid #e5e5e5; border-radius: 14px; padding: 14px; margin: 6px 0;
  background: #fff; width: 100%; text-align: left; }
.choice.selected { border-color: var(--green); background: #ddffcc; }
.choice.correct { border-color: var(--green); background: #d7ffb8; }
.choice.wrong { border-color: var(--red); background: #ffdfe0; }
.token { display: inline-block; border: 2px solid #e5e5e5; border-radius: 12px;
  padding: 10px 12px; margin: 4px; background: #fff; }
.progress { height: 14px; background: #e5e5e5; border-radius: 10px; overflow: hidden; }
.progress > i { display: block; height: 100%; background: var(--green); transition: width .2s; }
.header { display: flex; align-items: center; gap: 14px; padding: 8px 4px; font-weight: 700; }
```

- [ ] **Step 7: Create placeholder `src/App.jsx`**

```jsx
export default function App() {
  return <div className="app"><h1>Lingo Duck</h1></div>
}
```

- [ ] **Step 8: Create `src/main.jsx`**

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 9: Install deps and verify test runner boots**

Run: `cd /c/Users/a/orca/workspaces/lingoduck && npm install && npx vitest run`
Expected: install succeeds; vitest reports "No test files found" (exit 0) — runner works.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Vitest"
```

---

## Task 1: Curriculum seed + loader

**Files:**
- Create: `src/data/curriculum.json`, `src/data/loadCurriculum.js`
- Test: covered in later tasks via imports

- [ ] **Step 1: Create `src/data/curriculum.json`**

Seed = 유치원 2 units + 초1 2 units. Below is unit 1 fully; replicate the same shape for the other units with different words (인사/색깔, 동물, 숫자/음식, 가족/동사).

```json
{
  "levels": [
    {
      "id": "kinder",
      "name": "유치원",
      "units": [
        {
          "id": "kinder-u1",
          "title": "인사와 색깔",
          "lessons": [
            {
              "id": "kinder-u1-l1",
              "title": "Hello",
              "exercises": [
                { "type": "mcq", "prompt": "‘안녕’은 영어로?", "choices": ["Hello", "Bye", "Cat", "Red"], "answer": "Hello", "audioText": "Hello" },
                { "type": "match", "prompt": "짝을 맞추세요", "pairs": [["red", "빨강"], ["blue", "파랑"], ["green", "초록"]] },
                { "type": "wordbank", "prompt": "문장을 만드세요: ‘나는 파랑을 좋아해’", "tokens": ["I", "like", "blue"], "distractors": ["red", "you"], "answer": ["I", "like", "blue"], "audioText": "I like blue" },
                { "type": "listen", "prompt": "들리는 문장을 완성하세요", "tokens": ["I", "am", "happy"], "distractors": ["sad", "you"], "answer": ["I", "am", "happy"], "audioText": "I am happy" },
                { "type": "mcq", "prompt": "‘초록’은 영어로?", "choices": ["Green", "Blue", "Dog", "Bye"], "answer": "Green", "audioText": "Green" }
              ]
            },
            {
              "id": "kinder-u1-l2",
              "title": "Colors",
              "exercises": [
                { "type": "match", "prompt": "짝을 맞추세요", "pairs": [["yellow", "노랑"], ["black", "검정"], ["white", "하양"]] },
                { "type": "mcq", "prompt": "‘노랑’은 영어로?", "choices": ["Yellow", "Green", "Cat", "Hello"], "answer": "Yellow", "audioText": "Yellow" },
                { "type": "wordbank", "prompt": "문장을 만드세요: ‘그것은 빨강이야’", "tokens": ["It", "is", "red"], "distractors": ["blue", "am"], "answer": ["It", "is", "red"], "audioText": "It is red" },
                { "type": "listen", "prompt": "들리는 문장을 완성하세요", "tokens": ["I", "see", "yellow"], "distractors": ["red", "am"], "answer": ["I", "see", "yellow"], "audioText": "I see yellow" }
              ]
            }
          ]
        },
        {
          "id": "kinder-u2",
          "title": "동물",
          "lessons": [
            {
              "id": "kinder-u2-l1",
              "title": "Animals",
              "exercises": [
                { "type": "mcq", "prompt": "‘고양이’는 영어로?", "choices": ["Cat", "Dog", "Red", "Bye"], "answer": "Cat", "audioText": "Cat" },
                { "type": "match", "prompt": "짝을 맞추세요", "pairs": [["dog", "개"], ["cat", "고양이"], ["bird", "새"]] },
                { "type": "wordbank", "prompt": "문장을 만드세요: ‘나는 개를 좋아해’", "tokens": ["I", "like", "dogs"], "distractors": ["cats", "you"], "answer": ["I", "like", "dogs"], "audioText": "I like dogs" },
                { "type": "listen", "prompt": "들리는 문장을 완성하세요", "tokens": ["The", "cat", "is", "small"], "distractors": ["big", "dog"], "answer": ["The", "cat", "is", "small"], "audioText": "The cat is small" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "grade1",
      "name": "초등 1학년",
      "units": [
        {
          "id": "grade1-u1",
          "title": "숫자와 음식",
          "lessons": [
            {
              "id": "grade1-u1-l1",
              "title": "Numbers",
              "exercises": [
                { "type": "mcq", "prompt": "‘셋’은 영어로?", "choices": ["Three", "Two", "Apple", "Milk"], "answer": "Three", "audioText": "Three" },
                { "type": "match", "prompt": "짝을 맞추세요", "pairs": [["one", "하나"], ["two", "둘"], ["three", "셋"]] },
                { "type": "wordbank", "prompt": "문장을 만드세요: ‘나는 사과 두 개가 있어’", "tokens": ["I", "have", "two", "apples"], "distractors": ["milk", "three"], "answer": ["I", "have", "two", "apples"], "audioText": "I have two apples" },
                { "type": "listen", "prompt": "들리는 문장을 완성하세요", "tokens": ["I", "like", "milk"], "distractors": ["apple", "have"], "answer": ["I", "like", "milk"], "audioText": "I like milk" }
              ]
            }
          ]
        },
        {
          "id": "grade1-u2",
          "title": "가족과 동작",
          "lessons": [
            {
              "id": "grade1-u2-l1",
              "title": "Family",
              "exercises": [
                { "type": "mcq", "prompt": "‘엄마’는 영어로?", "choices": ["Mom", "Dad", "Run", "Milk"], "answer": "Mom", "audioText": "Mom" },
                { "type": "match", "prompt": "짝을 맞추세요", "pairs": [["mom", "엄마"], ["dad", "아빠"], ["baby", "아기"]] },
                { "type": "wordbank", "prompt": "문장을 만드세요: ‘나는 달릴 수 있어’", "tokens": ["I", "can", "run"], "distractors": ["jump", "you"], "answer": ["I", "can", "run"], "audioText": "I can run" },
                { "type": "listen", "prompt": "들리는 문장을 완성하세요", "tokens": ["My", "dad", "is", "tall"], "distractors": ["mom", "short"], "answer": ["My", "dad", "is", "tall"], "audioText": "My dad is tall" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create `src/data/loadCurriculum.js`**

```js
import curriculum from './curriculum.json'

export function getLevels() {
  return curriculum.levels
}

// Flat, ordered list of every lesson with its level/unit context.
export function getLessonSequence() {
  const seq = []
  for (const level of curriculum.levels) {
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        seq.push({ levelId: level.id, unitId: unit.id, lesson })
      }
    }
  }
  return seq
}

export function getLessonById(lessonId) {
  return getLessonSequence().find((x) => x.lesson.id === lessonId)?.lesson ?? null
}
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "console.log(require('./src/data/curriculum.json').levels.length)"`
Expected: `2`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: seed curriculum JSON + loader"
```

---

## Task 2: Scoring (pure) — TDD

**Files:**
- Create: `src/engine/scoring.js`
- Test: `tests/scoring.test.js`

- [ ] **Step 1: Write failing tests `tests/scoring.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { checkAnswer, arraysEqual } from '../src/engine/scoring.js'

describe('mcq', () => {
  const ex = { type: 'mcq', answer: 'Hello' }
  it('correct when choice equals answer', () => {
    expect(checkAnswer(ex, 'Hello')).toBe(true)
  })
  it('wrong otherwise', () => {
    expect(checkAnswer(ex, 'Bye')).toBe(false)
  })
})

describe('wordbank / listen (ordered tokens)', () => {
  const ex = { type: 'wordbank', answer: ['I', 'like', 'blue'] }
  it('correct on exact order', () => {
    expect(checkAnswer(ex, ['I', 'like', 'blue'])).toBe(true)
  })
  it('wrong on different order', () => {
    expect(checkAnswer(ex, ['like', 'I', 'blue'])).toBe(false)
  })
  it('wrong on wrong length', () => {
    expect(checkAnswer(ex, ['I', 'like'])).toBe(false)
  })
})

describe('match', () => {
  const ex = { type: 'match', pairs: [['red', '빨강'], ['blue', '파랑']] }
  it('correct when every pair mapped correctly', () => {
    expect(checkAnswer(ex, { red: '빨강', blue: '파랑' })).toBe(true)
  })
  it('wrong when any pair mismatched', () => {
    expect(checkAnswer(ex, { red: '파랑', blue: '빨강' })).toBe(false)
  })
})

describe('arraysEqual', () => {
  it('true for same', () => expect(arraysEqual([1, 2], [1, 2])).toBe(true))
  it('false for diff', () => expect(arraysEqual([1], [1, 2])).toBe(false))
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/scoring.test.js`
Expected: FAIL — cannot resolve `../src/engine/scoring.js`

- [ ] **Step 3: Implement `src/engine/scoring.js`**

```js
export function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

// response shape by type:
//   mcq     -> string
//   wordbank/listen -> string[] (ordered)
//   match   -> { [english]: koreanUserPicked }
export function checkAnswer(exercise, response) {
  switch (exercise.type) {
    case 'mcq':
      return response === exercise.answer
    case 'wordbank':
    case 'listen':
      return arraysEqual(response, exercise.answer)
    case 'match':
      return exercise.pairs.every(([en, ko]) => response?.[en] === ko)
    default:
      return false
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/scoring.test.js`
Expected: PASS (all)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: exercise scoring (mcq/wordbank/listen/match)"
```

---

## Task 3: Gamification (pure) — TDD

**Files:**
- Create: `src/engine/gamification.js`
- Test: `tests/gamification.test.js`

Rules: hearts start 5, wrong -1 (min 0). XP: correct +10; lesson perfect bonus +20. Streak: completing a lesson on a new local day +1; if the gap is more than 1 day, reset to 1 (a freeze can absorb exactly one missed day). Daily XP accumulates per local day and resets on a new day.

- [ ] **Step 1: Write failing tests `tests/gamification.test.js`**

```js
import { describe, it, expect } from 'vitest'
import {
  START_HEARTS, XP_CORRECT, XP_PERFECT_BONUS,
  loseHeart, xpForLesson, updateStreak, addDailyXp,
} from '../src/engine/gamification.js'

describe('hearts', () => {
  it('starts at 5', () => expect(START_HEARTS).toBe(5))
  it('decrements but not below 0', () => {
    expect(loseHeart(3)).toBe(2)
    expect(loseHeart(0)).toBe(0)
  })
})

describe('xpForLesson', () => {
  it('10 per correct', () => {
    expect(xpForLesson({ correct: 4, total: 5, mistakes: 1 })).toBe(4 * XP_CORRECT)
  })
  it('adds perfect bonus when no mistakes', () => {
    expect(xpForLesson({ correct: 5, total: 5, mistakes: 0 }))
      .toBe(5 * XP_CORRECT + XP_PERFECT_BONUS)
  })
})

describe('updateStreak', () => {
  const base = { count: 3, lastDay: '2026-08-07', freezes: 1 }
  it('increments on next day', () => {
    expect(updateStreak(base, '2026-08-08')).toEqual({ count: 4, lastDay: '2026-08-08', freezes: 1 })
  })
  it('no double-count same day', () => {
    expect(updateStreak(base, '2026-08-07')).toEqual(base)
  })
  it('freeze absorbs a single missed day', () => {
    expect(updateStreak(base, '2026-08-09'))
      .toEqual({ count: 4, lastDay: '2026-08-09', freezes: 0 })
  })
  it('resets when gap too big and no freeze', () => {
    const noFreeze = { count: 3, lastDay: '2026-08-01', freezes: 0 }
    expect(updateStreak(noFreeze, '2026-08-08'))
      .toEqual({ count: 1, lastDay: '2026-08-08', freezes: 0 })
  })
  it('starts at 1 from empty', () => {
    expect(updateStreak({ count: 0, lastDay: null, freezes: 1 }, '2026-08-08'))
      .toEqual({ count: 1, lastDay: '2026-08-08', freezes: 1 })
  })
})

describe('addDailyXp', () => {
  it('accumulates on same day', () => {
    expect(addDailyXp({ day: '2026-08-08', amount: 20 }, 10, '2026-08-08'))
      .toEqual({ day: '2026-08-08', amount: 30 })
  })
  it('resets on a new day', () => {
    expect(addDailyXp({ day: '2026-08-07', amount: 50 }, 10, '2026-08-08'))
      .toEqual({ day: '2026-08-08', amount: 10 })
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/gamification.test.js`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/engine/gamification.js`**

```js
export const START_HEARTS = 5
export const XP_CORRECT = 10
export const XP_PERFECT_BONUS = 20
export const DAILY_GOAL = 50

export function loseHeart(hearts) {
  return Math.max(0, hearts - 1)
}

export function xpForLesson({ correct, mistakes }) {
  const base = correct * XP_CORRECT
  return mistakes === 0 ? base + XP_PERFECT_BONUS : base
}

// 'YYYY-MM-DD' difference in whole days (b - a).
function dayDiff(a, b) {
  const ms = Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')
  return Math.round(ms / 86400000)
}

export function updateStreak(streak, today) {
  const { count, lastDay, freezes } = streak
  if (lastDay === null) return { count: 1, lastDay: today, freezes }
  const diff = dayDiff(lastDay, today)
  if (diff <= 0) return streak // same day (or earlier): no change
  if (diff === 1) return { count: count + 1, lastDay: today, freezes }
  if (diff === 2 && freezes > 0) return { count: count + 1, lastDay: today, freezes: freezes - 1 }
  return { count: 1, lastDay: today, freezes }
}

export function addDailyXp(daily, gained, today) {
  if (daily.day === today) return { day: today, amount: daily.amount + gained }
  return { day: today, amount: gained }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/gamification.test.js`
Expected: PASS (all)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: gamification rules (hearts/xp/streak/daily)"
```

---

## Task 4: Progress store (localStorage) — TDD

**Files:**
- Create: `src/store/progress.js`
- Test: `tests/progress.test.js`

- [ ] **Step 1: Write failing tests `tests/progress.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { loadProgress, saveProgress, resetProgress, defaultProgress, STORAGE_KEY } from '../src/store/progress.js'

beforeEach(() => localStorage.clear())

describe('progress store', () => {
  it('returns defaults when nothing saved', () => {
    expect(loadProgress()).toEqual(defaultProgress())
  })
  it('round-trips a saved value', () => {
    const p = defaultProgress()
    p.xp = 120
    p.completedLessons = ['kinder-u1-l1']
    saveProgress(p)
    expect(loadProgress()).toEqual(p)
  })
  it('reset clears storage back to defaults', () => {
    const p = defaultProgress()
    p.xp = 999
    saveProgress(p)
    resetProgress()
    expect(loadProgress()).toEqual(defaultProgress())
    expect(localStorage.getItem(STORAGE_KEY)).toBe(null)
  })
  it('tolerates corrupt JSON by returning defaults', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadProgress()).toEqual(defaultProgress())
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/progress.test.js`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/store/progress.js`**

```js
import { START_HEARTS } from '../engine/gamification.js'

export const STORAGE_KEY = 'lingoduck.progress.v1'

export function defaultProgress() {
  return {
    version: 1,
    xp: 0,
    hearts: START_HEARTS,
    streak: { count: 0, lastDay: null, freezes: 1 },
    completedLessons: [],
    dailyXp: { day: null, amount: 0 },
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    return { ...defaultProgress(), ...JSON.parse(raw) }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/progress.test.js`
Expected: PASS (all)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: localStorage progress store"
```

---

## Task 5: Session state machine (pure) — TDD

**Files:**
- Create: `src/engine/session.js`
- Test: `tests/session.test.js`

The session walks exercises in order. A wrong answer requeues that exercise to the end (so it is retried within the session) and counts a mistake. `correct` counts distinct exercises eventually answered correctly. The session ends when the queue is empty (`done`).

- [ ] **Step 1: Write failing tests `tests/session.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { createSession, answer, currentExercise } from '../src/engine/session.js'

const exercises = [
  { type: 'mcq', answer: 'A' },
  { type: 'mcq', answer: 'B' },
]

describe('session', () => {
  it('starts at first exercise, not done', () => {
    const s = createSession(exercises)
    expect(currentExercise(s).answer).toBe('A')
    expect(s.done).toBe(false)
    expect(s.total).toBe(2)
  })

  it('advances on correct answers and finishes', () => {
    let s = createSession(exercises)
    s = answer(s, true)
    expect(currentExercise(s).answer).toBe('B')
    s = answer(s, true)
    expect(s.done).toBe(true)
    expect(s.correct).toBe(2)
    expect(s.mistakes).toBe(0)
  })

  it('requeues a wrong exercise and counts a mistake', () => {
    let s = createSession(exercises)
    s = answer(s, false) // A wrong -> requeue
    expect(s.mistakes).toBe(1)
    expect(currentExercise(s).answer).toBe('B') // moved on to B
    s = answer(s, true) // B correct
    expect(currentExercise(s).answer).toBe('A') // A comes back
    s = answer(s, true) // A now correct
    expect(s.done).toBe(true)
    expect(s.correct).toBe(2)
    expect(s.mistakes).toBe(1)
  })

  it('progress reflects distinct completed count', () => {
    let s = createSession(exercises)
    expect(s.completed).toBe(0)
    s = answer(s, true)
    expect(s.completed).toBe(1)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/session.test.js`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/engine/session.js`**

```js
// Immutable-ish session state. Each call returns a new state object.
export function createSession(exercises) {
  return {
    queue: exercises.map((ex, i) => ({ ex, id: i })),
    total: exercises.length,
    completed: 0,   // distinct exercises answered correctly
    correct: 0,     // same as completed at end; kept for clarity
    mistakes: 0,
    done: exercises.length === 0,
  }
}

export function currentExercise(session) {
  return session.queue[0]?.ex ?? null
}

export function answer(session, isCorrect) {
  const [head, ...rest] = session.queue
  if (!head) return { ...session, done: true }

  let queue, completed, correct, mistakes
  if (isCorrect) {
    queue = rest
    completed = session.completed + 1
    correct = session.correct + 1
    mistakes = session.mistakes
  } else {
    queue = [...rest, head] // requeue to end
    completed = session.completed
    correct = session.correct
    mistakes = session.mistakes + 1
  }
  return { ...session, queue, completed, correct, mistakes, done: queue.length === 0 }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/session.test.js`
Expected: PASS (all)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: lesson session state machine with wrong-answer requeue"
```

---

## Task 6: Audio (TTS + SFX)

**Files:**
- Create: `src/audio/tts.js`, `src/audio/sfx.js`

No unit tests (browser-only APIs); guarded to no-op when unavailable so the app never crashes under jsdom.

- [ ] **Step 1: Create `src/audio/tts.js`**

```js
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text, lang = 'en-US') {
  if (!canSpeak() || !text) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 2: Create `src/audio/sfx.js`**

```js
let ctx = null
function ac() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

function beep(freqs) {
  const c = ac()
  if (!c) return
  const now = c.currentTime
  freqs.forEach(([f, t], i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.value = f
    o.type = 'sine'
    o.connect(g)
    g.connect(c.destination)
    const start = now + i * 0.09
    g.gain.setValueAtTime(0.001, start)
    g.gain.exponentialRampToValueAtTime(0.2, start + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, start + t)
    o.start(start)
    o.stop(start + t)
  })
}

export function playCorrect() {
  beep([[660, 0.12], [880, 0.16]])
}
export function playWrong() {
  beep([[300, 0.2], [200, 0.24]])
}
```

- [ ] **Step 3: Verify build still compiles**

Run: `npx vite build`
Expected: build succeeds (no import errors).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: TTS + WebAudio sound effects (guarded)"
```

---

## Task 7: Exercise components — TDD

**Files:**
- Create: `src/components/exercises/Mcq.jsx`, `WordBank.jsx`, `Listen.jsx`, `Match.jsx`
- Test: `tests/exercises.test.jsx`

Common contract: `props = { exercise, onAnswer(isCorrect) }`. Each component renders a "확인" button (disabled until an answer is composed); clicking it calls `checkAnswer` and then `onAnswer(result)`.

- [ ] **Step 1: Write failing tests `tests/exercises.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Mcq from '../src/components/exercises/Mcq.jsx'
import WordBank from '../src/components/exercises/WordBank.jsx'
import Match from '../src/components/exercises/Match.jsx'

describe('Mcq', () => {
  const ex = { type: 'mcq', prompt: 'p', choices: ['Hello', 'Bye'], answer: 'Hello', audioText: 'Hello' }
  it('reports correct when right choice picked', () => {
    const onAnswer = vi.fn()
    render(<Mcq exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Hello'))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
  it('reports wrong when wrong choice picked', () => {
    const onAnswer = vi.fn()
    render(<Mcq exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Bye'))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
})

describe('WordBank', () => {
  const ex = { type: 'wordbank', prompt: 'p', tokens: ['I', 'like', 'blue'], distractors: ['red'], answer: ['I', 'like', 'blue'], audioText: 'I like blue' }
  it('correct when tokens assembled in order', () => {
    const onAnswer = vi.fn()
    render(<WordBank exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByRole('button', { name: 'I' }))
    fireEvent.click(screen.getByRole('button', { name: 'like' }))
    fireEvent.click(screen.getByRole('button', { name: 'blue' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
})

describe('Match', () => {
  const ex = { type: 'match', prompt: 'p', pairs: [['red', '빨강'], ['blue', '파랑']] }
  it('correct when each english mapped to its korean', () => {
    const onAnswer = vi.fn()
    render(<Match exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByRole('button', { name: 'red' }))
    fireEvent.click(screen.getByRole('button', { name: '빨강' }))
    fireEvent.click(screen.getByRole('button', { name: 'blue' }))
    fireEvent.click(screen.getByRole('button', { name: '파랑' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/exercises.test.jsx`
Expected: FAIL — cannot resolve component modules

- [ ] **Step 3: Implement `src/components/exercises/Mcq.jsx`**

```jsx
import { useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak } from '../../audio/tts.js'

export default function Mcq({ exercise, onAnswer }) {
  const [picked, setPicked] = useState(null)
  return (
    <div>
      <h2>{exercise.prompt}</h2>
      {exercise.audioText && (
        <button className="btn-ghost choice" onClick={() => speak(exercise.audioText)}>🔊 듣기</button>
      )}
      {exercise.choices.map((c) => (
        <button
          key={c}
          className={`choice ${picked === c ? 'selected' : ''}`}
          onClick={() => setPicked(c)}
        >
          {c}
        </button>
      ))}
      <button className="btn" disabled={picked === null}
        onClick={() => onAnswer(checkAnswer(exercise, picked))}>확인</button>
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/exercises/WordBank.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak } from '../../audio/tts.js'

function shuffle(arr) {
  return [...arr].sort((a, b) => (a + a).localeCompare(b + b))
}

export default function WordBank({ exercise, onAnswer }) {
  const bank = useMemo(
    () => shuffle([...exercise.tokens, ...(exercise.distractors || [])]).map((t, i) => ({ t, i })),
    [exercise]
  )
  const [chosen, setChosen] = useState([]) // array of {t,i}
  const chosenIds = new Set(chosen.map((c) => c.i))

  return (
    <div>
      <h2>{exercise.prompt}</h2>
      {exercise.audioText && (
        <button className="btn-ghost choice" onClick={() => speak(exercise.audioText)}>🔊 듣기</button>
      )}
      <div className="progress" style={{ minHeight: 48, background: '#fff', border: '2px solid #e5e5e5', padding: 6 }}>
        {chosen.map((c) => (
          <button key={c.i} className="token" onClick={() => setChosen(chosen.filter((x) => x.i !== c.i))}>{c.t}</button>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        {bank.map((b) => (
          <button key={b.i} className="token" disabled={chosenIds.has(b.i)}
            onClick={() => setChosen([...chosen, b])}>{b.t}</button>
        ))}
      </div>
      <button className="btn" disabled={chosen.length === 0}
        onClick={() => onAnswer(checkAnswer(exercise, chosen.map((c) => c.t)))}>확인</button>
    </div>
  )
}
```

- [ ] **Step 5: Implement `src/components/exercises/Listen.jsx`**

```jsx
import { useEffect, useMemo, useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak, canSpeak } from '../../audio/tts.js'

function shuffle(arr) {
  return [...arr].sort((a, b) => (a + a).localeCompare(b + b))
}

export default function Listen({ exercise, onAnswer }) {
  const bank = useMemo(
    () => shuffle([...exercise.tokens, ...(exercise.distractors || [])]).map((t, i) => ({ t, i })),
    [exercise]
  )
  const [chosen, setChosen] = useState([])
  const chosenIds = new Set(chosen.map((c) => c.i))

  useEffect(() => { speak(exercise.audioText) }, [exercise])

  return (
    <div>
      <h2>{exercise.prompt}</h2>
      <button className="btn-ghost choice" onClick={() => speak(exercise.audioText)}>🔊 다시 듣기</button>
      {!canSpeak() && <p style={{ color: 'var(--muted)' }}>({exercise.audioText})</p>}
      <div style={{ minHeight: 48, background: '#fff', border: '2px solid #e5e5e5', padding: 6, borderRadius: 10 }}>
        {chosen.map((c) => (
          <button key={c.i} className="token" onClick={() => setChosen(chosen.filter((x) => x.i !== c.i))}>{c.t}</button>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        {bank.map((b) => (
          <button key={b.i} className="token" disabled={chosenIds.has(b.i)}
            onClick={() => setChosen([...chosen, b])}>{b.t}</button>
        ))}
      </div>
      <button className="btn" disabled={chosen.length === 0}
        onClick={() => onAnswer(checkAnswer(exercise, chosen.map((c) => c.t)))}>확인</button>
    </div>
  )
}
```

- [ ] **Step 6: Implement `src/components/exercises/Match.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'

function shuffle(arr) {
  return [...arr].sort((a, b) => (a + a).localeCompare(b + b))
}

export default function Match({ exercise, onAnswer }) {
  const lefts = exercise.pairs.map(([en]) => en)
  const rights = useMemo(() => shuffle(exercise.pairs.map(([, ko]) => ko)), [exercise])
  const [selEn, setSelEn] = useState(null)
  const [map, setMap] = useState({}) // { english: koreanChosen }

  function pickKo(ko) {
    if (!selEn) return
    setMap({ ...map, [selEn]: ko })
    setSelEn(null)
  }

  const complete = lefts.every((en) => map[en] != null)

  return (
    <div>
      <h2>{exercise.prompt}</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          {lefts.map((en) => (
            <button key={en}
              className={`choice ${selEn === en ? 'selected' : ''} ${map[en] ? 'correct' : ''}`}
              onClick={() => setSelEn(en)}>
              {en}{map[en] ? ` → ${map[en]}` : ''}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {rights.map((ko) => {
            const used = Object.values(map).includes(ko)
            return (
              <button key={ko} className="choice" disabled={used} onClick={() => pickKo(ko)}>{ko}</button>
            )
          })}
        </div>
      </div>
      <button className="btn" disabled={!complete}
        onClick={() => onAnswer(checkAnswer(exercise, map))}>확인</button>
    </div>
  )
}
```

- [ ] **Step 7: Run to verify pass**

Run: `npx vitest run tests/exercises.test.jsx`
Expected: PASS (all)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: 4 exercise components (mcq/wordbank/listen/match)"
```

---

## Task 8: Duck mascot, Header, Result

**Files:**
- Create: `src/components/Duck.jsx`, `src/components/Header.jsx`, `src/components/Result.jsx`

No new unit tests (presentational); verified via the smoke test in Task 10.

- [ ] **Step 1: Create `src/components/Duck.jsx`**

```jsx
// Original mascot — a friendly yellow duck (NOT an owl). mood: happy|sad|cheer
export default function Duck({ mood = 'happy', size = 96 }) {
  const eyeY = mood === 'sad' ? 40 : 38
  const beakColor = '#ff9800'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`duck-${mood}`} role="img">
      <ellipse cx="50" cy="62" rx="30" ry="28" fill="var(--yellow)" />
      <circle cx="50" cy="38" r="24" fill="var(--yellow)" />
      <circle cx="42" cy={eyeY} r="4" fill="#3c3c3c" />
      <circle cx="58" cy={eyeY} r="4" fill="#3c3c3c" />
      <polygon points="44,46 56,46 50,54" fill={beakColor} />
      {mood === 'cheer' && <text x="78" y="26" fontSize="18">✨</text>}
      {mood === 'sad' && <path d="M44 58 Q50 54 56 58" stroke="#3c3c3c" strokeWidth="2" fill="none" />}
      {mood !== 'sad' && <path d="M44 56 Q50 62 56 56" stroke="#3c3c3c" strokeWidth="2" fill="none" />}
    </svg>
  )
}
```

- [ ] **Step 2: Create `src/components/Header.jsx`**

```jsx
import { DAILY_GOAL } from '../engine/gamification.js'

export default function Header({ progress }) {
  const goalPct = Math.min(100, Math.round((progress.dailyXp.amount / DAILY_GOAL) * 100))
  return (
    <div className="header">
      <span>❤️ {progress.hearts}</span>
      <span>🔥 {progress.streak.count}</span>
      <span>⭐ {progress.xp} XP</span>
      <div className="progress" style={{ flex: 1 }}>
        <i style={{ width: `${goalPct}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/Result.jsx`**

```jsx
import Duck from './Duck.jsx'

export default function Result({ summary, onContinue }) {
  const perfect = summary.mistakes === 0
  return (
    <div style={{ textAlign: 'center' }}>
      <Duck mood={perfect ? 'cheer' : 'happy'} size={120} />
      <h2>{perfect ? '완벽해요!' : '잘했어요!'}</h2>
      <p>정답 {summary.correct} / {summary.total} · 실수 {summary.mistakes}</p>
      <p>⭐ +{summary.xpGained} XP</p>
      <button className="btn" onClick={onContinue}>계속하기</button>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: mascot, header, result screens"
```

---

## Task 9: Lesson container

**Files:**
- Create: `src/components/Lesson.jsx`

Drives one session: renders the current exercise component by type, shows a progress bar, plays feedback SFX, and on `done` computes XP and calls `onFinish(summary)`.

- [ ] **Step 1: Create `src/components/Lesson.jsx`**

```jsx
import { useState } from 'react'
import { createSession, currentExercise, answer } from '../engine/session.js'
import { xpForLesson } from '../engine/gamification.js'
import { playCorrect, playWrong } from '../audio/sfx.js'
import Mcq from './exercises/Mcq.jsx'
import WordBank from './exercises/WordBank.jsx'
import Listen from './exercises/Listen.jsx'
import Match from './exercises/Match.jsx'

const REGISTRY = { mcq: Mcq, wordbank: WordBank, listen: Listen, match: Match }

export default function Lesson({ lesson, onWrong, onFinish, onQuit }) {
  const [session, setSession] = useState(() => createSession(lesson.exercises))
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong' | null

  const ex = currentExercise(session)
  const pct = Math.round((session.completed / session.total) * 100)

  function handleAnswer(isCorrect) {
    if (isCorrect) { playCorrect() } else { playWrong(); onWrong?.() }
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      setFeedback(null)
      const next = answer(session, isCorrect)
      setSession(next)
      if (next.done) {
        const xpGained = xpForLesson({ correct: next.correct, total: next.total, mistakes: next.mistakes })
        onFinish({ correct: next.correct, total: next.total, mistakes: next.mistakes, xpGained })
      }
    }, 550)
  }

  if (!ex) return null
  const ExComp = REGISTRY[ex.type]

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="token" onClick={onQuit}>✕</button>
        <div className="progress" style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div key={session.queue[0].id} style={{ marginTop: 16 }}>
        <ExComp exercise={ex} onAnswer={handleAnswer} />
      </div>
      {feedback && (
        <div style={{ marginTop: 12, fontWeight: 700, color: feedback === 'correct' ? 'var(--green)' : 'var(--red)' }}>
          {feedback === 'correct' ? '정답이에요! ✅' : '아쉬워요, 다시 나올 거예요. ❌'}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: lesson session container with feedback + progress"
```

---

## Task 10: Path screen + App wiring + smoke test

**Files:**
- Create: `src/components/Path.jsx`
- Modify: `src/App.jsx`
- Test: extend `tests/exercises.test.jsx` is out of scope; add `tests/app.test.jsx` smoke

- [ ] **Step 1: Create `src/components/Path.jsx`**

```jsx
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
```

- [ ] **Step 2: Replace `src/App.jsx`**

```jsx
import { useState } from 'react'
import Header from './components/Header.jsx'
import Path from './components/Path.jsx'
import Lesson from './components/Lesson.jsx'
import Result from './components/Result.jsx'
import Duck from './components/Duck.jsx'
import { getLessonById } from './data/loadCurriculum.js'
import { loadProgress, saveProgress, resetProgress, defaultProgress } from './store/progress.js'
import { loseHeart, updateStreak, addDailyXp } from './engine/gamification.js'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress())
  const [screen, setScreen] = useState('path') // 'path' | 'lesson' | 'result' | 'fail'
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [summary, setSummary] = useState(null)

  function persist(next) { setProgress(next); saveProgress(next) }

  function startLesson(id) {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    setActiveLessonId(id)
    setScreen('lesson')
  }

  function handleWrong() {
    const next = { ...progress, hearts: loseHeart(progress.hearts) }
    persist(next)
    if (next.hearts <= 0) setScreen('fail')
  }

  function handleFinish(s) {
    const today = todayStr()
    const next = {
      ...progress,
      xp: progress.xp + s.xpGained,
      dailyXp: addDailyXp(progress.dailyXp, s.xpGained, today),
      streak: updateStreak(progress.streak, today),
      completedLessons: progress.completedLessons.includes(activeLessonId)
        ? progress.completedLessons
        : [...progress.completedLessons, activeLessonId],
    }
    persist(next)
    setSummary(s)
    setScreen('result')
  }

  function hardReset() {
    resetProgress()
    persist(defaultProgress())
    setScreen('path')
  }

  return (
    <div className="app">
      <Header progress={progress} />
      {screen === 'path' && (
        <>
          <Path progress={progress} onStart={startLesson} />
          <button className="btn-ghost choice" onClick={hardReset}>진도 초기화</button>
        </>
      )}
      {screen === 'lesson' && (
        <Lesson
          lesson={getLessonById(activeLessonId)}
          onWrong={handleWrong}
          onFinish={handleFinish}
          onQuit={() => setScreen('path')}
        />
      )}
      {screen === 'result' && summary && (
        <Result summary={summary} onContinue={() => setScreen('path')} />
      )}
      {screen === 'fail' && (
        <div style={{ textAlign: 'center' }}>
          <Duck mood="sad" size={120} />
          <h2>하트가 없어요</h2>
          <p>잠시 후 다시 도전하거나 진도를 초기화할 수 있어요.</p>
          <button className="btn" onClick={() => setScreen('path')}>경로로 돌아가기</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write smoke test `tests/app.test.jsx`**

```jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'

beforeEach(() => localStorage.clear())

describe('App smoke', () => {
  it('renders the path with the first lesson unlocked', () => {
    render(<App />)
    expect(screen.getByText('유치원')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hello/ })).not.toBeDisabled()
  })

  it('opens a lesson when the first node is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Hello/ }))
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: PASS across scoring, gamification, session, progress, exercises, app.

- [ ] **Step 5: Verify production build**

Run: `npx vite build`
Expected: build succeeds; `dist/` produced.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: path screen + app wiring + smoke tests"
```

---

## Task 11: Manual verification + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run dev server and manually verify one full lesson**

Run: `npm run dev` then open the printed URL.
Verify: start "Hello" lesson → answer all exercises → wrong answer removes a heart and requeues → result screen shows XP → returning to path shows ✅ on the lesson and the next lesson unlocked. Confirm 🔊 buttons speak (in a browser that supports SpeechSynthesis).

- [ ] **Step 2: Create `README.md`**

```markdown
# Lingo Duck

광고 없는 오리지널 영어 학습 웹앱. 듀오링고의 핵심 게이미피케이션(하트·XP·스트릭·레슨 루프)을 재현하되 마스코트/색/콘텐츠는 자체 제작.

## 실행
```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm test         # 단위 테스트
```

## 구조
- `src/engine/*` — 채점·게이미피케이션·세션 상태머신(순수 로직, 테스트 대상)
- `src/store/progress.js` — localStorage 진도
- `src/data/curriculum.json` — 손수 씨앗 커리큘럼(레벨→유닛→레슨→문제)
- `src/components/*` — UI (경로·헤더·레슨·결과·4개 문제 유형)
- `src/audio/*` — Web Speech 발음 + WebAudio 효과음

## 콘텐츠 추가
`curriculum.json`에 레벨/유닛/레슨/문제를 스키마대로 추가하면 자동 반영.
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: README + manual verification pass"
```

---

## Self-Review Notes

- **Spec coverage:** UX 재현(하트/XP/스트릭/오답 재출제/피드백) → Tasks 3,5,9; 4 유형 → Tasks 2,7; 오리지널 브랜딩/마스코트 → Task 8; 콘텐츠 JSON → Task 1; 진도 localStorage → Task 4; 오디오 → Task 6; 반응형 웹 → styles.css(Task 0) + max-width 480 레이아웃; 테스트 → 각 순수 모듈 + 스모크.
- **Type consistency:** `checkAnswer(exercise, response)` response shapes are consistent across scoring tests and all four components (string / string[] / {en:ko}). `session` fields (`completed/correct/mistakes/done/total/queue`) match usage in `Lesson.jsx`. `progress` shape identical across store, Header, App, gamification calls.
- **Known simplification:** grade-level content is a small seed (유치원 2 units + 초1 2 units); expansion is pure data. Heart regeneration over time is deferred (fail screen returns to path; reset available) — matches spec's "회복" as a later enhancement without blocking the loop.
