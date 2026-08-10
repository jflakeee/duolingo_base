# Phase 1 — 화면 완성도 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise Lingo Duck's existing screens to original-Duolingo visual/interaction quality — winding path connectors, bouncing current node, unified sticky check bar, an explicit answer sheet that shows the correct answer with a Continue button (replacing the 550ms auto-advance), an in-lesson combo counter, and automatic dark mode.

**Architecture:** Keep all game logic pure and framework-free. The one behavior change (answer sheet) is handled entirely inside `Lesson.jsx`, which derives the correct-answer text from the exercise via a new pure function — the exercise component contract `{ exercise, onAnswer(isCorrect) }` stays unchanged. Visuals are CSS-driven. No new dependencies, no backend, no external assets.

**Tech Stack:** React 18, Vite 5, Vitest. Repo: `C:\Users\a\orca\workspaces\lingoduck` (branch `main`, 40 tests passing).

**Constraint:** Original branding only — do not copy any third-party (Duolingo) asset. Preserve every test-critical string (`확인`, exercise words, lesson titles, level names). Use git author flags on every commit: `git -c user.name="jflakeee" -c user.email="jflakeee@gmail.com" commit -m "..."`.

---

## File Structure

```
src/engine/answerText.js        # NEW pure fn: human-readable correct answer per exercise type
src/components/Lesson.jsx        # MODIFY: answer sheet + combo, remove auto-advance timer
src/components/exercises/Mcq.jsx # MODIFY: wrap 확인 in .action-bar
src/components/exercises/Match.jsx # MODIFY: two-column layout class + wrap 확인 in .action-bar
src/components/Path.jsx          # MODIFY: absolute-positioned nodes + SVG winding connector
src/styles.css                   # MODIFY: node bounce, answer sheet, road connector, dark mode
tests/answerText.test.js         # NEW unit tests
```

---

## Task 1: correctAnswerText pure function (TDD)

**Files:**
- Create: `src/engine/answerText.js`
- Test: `tests/answerText.test.js`

- [ ] **Step 1: Write failing test `tests/answerText.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { correctAnswerText } from '../src/engine/answerText.js'

describe('correctAnswerText', () => {
  it('mcq → the answer string', () => {
    expect(correctAnswerText({ type: 'mcq', answer: 'Hello' })).toBe('Hello')
  })
  it('wordbank → answer joined by spaces', () => {
    expect(correctAnswerText({ type: 'wordbank', answer: ['I', 'like', 'blue'] })).toBe('I like blue')
  })
  it('listen → answer joined by spaces', () => {
    expect(correctAnswerText({ type: 'listen', answer: ['I', 'am', 'happy'] })).toBe('I am happy')
  })
  it('match → en=ko pairs joined by comma', () => {
    expect(correctAnswerText({ type: 'match', pairs: [['red', '빨강'], ['blue', '파랑']] }))
      .toBe('red=빨강, blue=파랑')
  })
  it('unknown type → empty string', () => {
    expect(correctAnswerText({ type: 'x' })).toBe('')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/answerText.test.js`
Expected: FAIL — cannot resolve `../src/engine/answerText.js`

- [ ] **Step 3: Implement `src/engine/answerText.js`**

```js
// Human-readable correct answer for display in the lesson answer sheet.
export function correctAnswerText(exercise) {
  switch (exercise.type) {
    case 'mcq':
      return exercise.answer
    case 'wordbank':
    case 'listen':
      return exercise.answer.join(' ')
    case 'match':
      return exercise.pairs.map(([en, ko]) => `${en}=${ko}`).join(', ')
    default:
      return ''
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/answerText.test.js`
Expected: PASS (5)

- [ ] **Step 5: Commit**

```bash
git add src/engine/answerText.js tests/answerText.test.js
git commit -m "feat: correctAnswerText helper for answer sheet"
```

---

## Task 2: Unify the sticky check bar (Mcq + Match)

**Files:**
- Modify: `src/components/exercises/Mcq.jsx`
- Modify: `src/components/exercises/Match.jsx`

WordBank/Listen already wrap 확인 in `.action-bar`. Do the same for Mcq and Match so the check button is a consistent sticky bottom bar. Text and logic unchanged.

- [ ] **Step 1: Mcq — wrap the 확인 button**

In `src/components/exercises/Mcq.jsx`, replace this line:

```jsx
      <button className="btn" disabled={picked === null}
        onClick={() => onAnswer(checkAnswer(exercise, picked))}>확인</button>
```

with:

```jsx
      <div className="action-bar">
        <button className="btn" disabled={picked === null}
          onClick={() => onAnswer(checkAnswer(exercise, picked))}>확인</button>
      </div>
```

- [ ] **Step 2: Match — add layout class and wrap 확인**

In `src/components/exercises/Match.jsx`, replace:

```jsx
      <div style={{ display: 'flex', gap: 10 }}>
```

with:

```jsx
      <div className="match-grid">
```

and replace:

```jsx
      <button className="btn" disabled={!complete}
        onClick={() => onAnswer(checkAnswer(exercise, map))}>확인</button>
```

with:

```jsx
      <div className="action-bar">
        <button className="btn" disabled={!complete}
          onClick={() => onAnswer(checkAnswer(exercise, map))}>확인</button>
      </div>
```

Also replace the two inner `<div style={{ flex: 1 }}>` with `<div className="match-col">` (both columns).

- [ ] **Step 3: Verify existing exercise tests still pass**

Run: `npx vitest run tests/exercises.test.jsx`
Expected: PASS (4) — button names/logic unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/exercises/Mcq.jsx src/components/exercises/Match.jsx
git commit -m "feat: unify sticky check bar across all exercise types"
```

---

## Task 3: Lesson answer sheet + combo (remove auto-advance)

**Files:**
- Modify: `src/components/Lesson.jsx`

Behavior change: on answer, show a bottom sheet (correct = green with combo, wrong = red showing the correct answer). Advance only when the user taps **계속**. Track an in-lesson combo (consecutive correct). SFX + `onWrong` fire at judge time (unchanged); only the advance moves to the Continue tap.

- [ ] **Step 1: Replace the whole component body of `src/components/Lesson.jsx`**

```jsx
import { useState } from 'react'
import { createSession, currentExercise, answer } from '../engine/session.js'
import { xpForLesson } from '../engine/gamification.js'
import { correctAnswerText } from '../engine/answerText.js'
import { playCorrect, playWrong } from '../audio/sfx.js'
import Mcq from './exercises/Mcq.jsx'
import WordBank from './exercises/WordBank.jsx'
import Listen from './exercises/Listen.jsx'
import Match from './exercises/Match.jsx'

const REGISTRY = { mcq: Mcq, wordbank: WordBank, listen: Listen, match: Match }

export default function Lesson({ lesson, onWrong, onFinish, onQuit }) {
  const [session, setSession] = useState(() => createSession(lesson.exercises))
  const [combo, setCombo] = useState(0)
  // sheet: null | { correct: boolean, answerText: string, combo: number }
  const [sheet, setSheet] = useState(null)

  const ex = currentExercise(session)
  const pct = Math.round((session.completed / session.total) * 100)

  function handleAnswer(isCorrect) {
    const nextCombo = isCorrect ? combo + 1 : 0
    if (isCorrect) { playCorrect() } else { playWrong(); onWrong?.() }
    setCombo(nextCombo)
    setSheet({ correct: isCorrect, answerText: correctAnswerText(ex), combo: nextCombo })
  }

  function handleContinue() {
    const wasCorrect = sheet.correct
    setSheet(null)
    const next = answer(session, wasCorrect)
    setSession(next)
    if (next.done) {
      const xpGained = xpForLesson({ correct: next.correct, total: next.total, mistakes: next.mistakes })
      onFinish({ correct: next.correct, total: next.total, mistakes: next.mistakes, xpGained })
    }
  }

  if (!ex) return null
  const ExComp = REGISTRY[ex.type]

  return (
    <div>
      <div className="lesson-top">
        <button className="iconbtn" onClick={onQuit} aria-label="레슨 나가기">✕</button>
        <div className="progress" style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="ex" key={session.queue[0].id}>
        <ExComp exercise={ex} onAnswer={handleAnswer} />
      </div>

      {sheet && (
        <div className={`sheet sheet--${sheet.correct ? 'correct' : 'wrong'}`}>
          <div className="sheet__msg">
            <span className="sheet__badge">{sheet.correct ? '🎉' : '💡'}</span>
            <div>
              <strong>{sheet.correct ? '정답이에요!' : '아쉬워요'}</strong>
              {sheet.correct && sheet.combo >= 2 && <span className="combo">🔥 콤보 x{sheet.combo}</span>}
              {!sheet.correct && <div className="sheet__answer">정답: {sheet.answerText}</div>}
            </div>
          </div>
          <button className="btn" onClick={handleContinue}>계속</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the app smoke tests still pass**

Run: `npx vitest run tests/app.test.jsx`
Expected: PASS (2) — opening a lesson still renders the first exercise + 확인.

- [ ] **Step 3: Commit**

```bash
git add src/components/Lesson.jsx
git commit -m "feat: lesson answer sheet with correct answer + combo (no auto-advance)"
```

---

## Task 4: Winding path connector (Path rewrite)

**Files:**
- Modify: `src/components/Path.jsx`

Render each unit's lessons as **absolutely-positioned** nodes over an SVG connector. Geometry is deterministic (no DOM measurement): a fixed vertical pitch and percentage-based horizontal sway make the SVG bezier align with the nodes at any screen width (SVG uses `preserveAspectRatio="none"`, viewBox width 100 = percent of container, viewBox y = pixels). Completed segments draw green, the rest gray/dashed. Node accessible name still contains the lesson title (keeps the `/Hello/` smoke test working).

- [ ] **Step 1: Replace the whole `src/components/Path.jsx`**

```jsx
import { getLevels } from '../data/loadCurriculum.js'
import Duck from './Duck.jsx'

// horizontal sway as a PERCENT of container width (aligns with the SVG viewBox x-units)
const SWAY = [0, 14, 20, 14, 0, -14, -20, -14]
const PITCH = 116 // px per node row
const DISC_CY = 40 // disc center offset from node top (px)

function cx(i) { return 50 + SWAY[i % SWAY.length] }
function cy(i) { return i * PITCH + DISC_CY }

// build one smooth cubic-bezier path string through the node centers
function roadPath(n) {
  let d = `M ${cx(0)} ${cy(0)}`
  for (let i = 1; i < n; i++) {
    const ymid = (cy(i - 1) + cy(i)) / 2
    d += ` C ${cx(i - 1)} ${ymid} ${cx(i)} ${ymid} ${cx(i)} ${cy(i)}`
  }
  return d
}

// green path only for segments whose earlier lesson is done
function donePath(lessons, done) {
  const n = lessons.length
  let d = ''
  for (let i = 1; i < n; i++) {
    if (done.has(lessons[i - 1].id)) {
      const ymid = (cy(i - 1) + cy(i)) / 2
      d += `M ${cx(i - 1)} ${cy(i - 1)} C ${cx(i - 1)} ${ymid} ${cx(i)} ${ymid} ${cx(i)} ${cy(i)} `
    }
  }
  return d.trim()
}

export default function Path({ progress, onStart }) {
  const done = new Set(progress.completedLessons)
  const seq = []
  getLevels().forEach((lvl) => lvl.units.forEach((u) => u.lessons.forEach((l) => seq.push(l.id))))
  const isLocked = (id) => {
    const idx = seq.indexOf(id)
    return idx > 0 && !done.has(seq[idx - 1])
  }
  const totalDone = progress.completedLessons.length

  return (
    <div>
      <div className="path-hero">
        <Duck mood="cheer" size={64} bob />
        <div>
          <p>안녕! 나는 덕이 🦆</p>
          <p className="sub">
            {totalDone === 0 ? '첫 레슨부터 시작해요!' : `지금까지 레슨 ${totalDone}개 완료 · 계속 가요!`}
          </p>
        </div>
      </div>

      {getLevels().map((lvl, li) => {
        const lessonCount = lvl.units.reduce((n, u) => n + u.lessons.length, 0)
        return (
          <section key={lvl.id} className={`level level--${li % 3}`}>
            <div className="level__head">
              <h2>{lvl.name}</h2>
              <span className="sub">{lvl.units.length}유닛 · {lessonCount}레슨</span>
            </div>

            {lvl.units.map((u) => {
              const n = u.lessons.length
              const height = (n - 1) * PITCH + 96
              return (
                <div key={u.id} className="unit">
                  <div className="unit__title">{u.title}</div>
                  <div className="nodes" style={{ height }}>
                    <svg
                      className="nodes__road"
                      viewBox={`0 0 100 ${height}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path className="road road--bg" d={roadPath(n)} />
                      <path className="road road--done" d={donePath(u.lessons, done)} />
                    </svg>
                    {u.lessons.map((l, i) => {
                      const complete = done.has(l.id)
                      const locked = isLocked(l.id)
                      const current = !complete && !locked
                      const state = complete ? 'done' : locked ? 'locked' : 'current'
                      const icon = complete ? '✓' : locked ? '🔒' : '▶'
                      return (
                        <button
                          key={l.id}
                          className={`node node--${state}`}
                          disabled={locked}
                          onClick={() => onStart(l.id)}
                          style={{ top: i * PITCH, left: `${cx(i)}%` }}
                        >
                          {current && <span className="node__bubble">시작</span>}
                          <span className="node__disc" aria-hidden="true">{icon}</span>
                          <span className="node__label">{l.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify smoke tests still pass (node names unchanged)**

Run: `npx vitest run tests/app.test.jsx`
Expected: PASS (2) — `유치원` heading present, first `Hello` node enabled.

- [ ] **Step 3: Commit**

```bash
git add src/components/Path.jsx
git commit -m "feat: winding SVG path connector with absolute nodes"
```

---

## Task 5: Styles — node bounce, answer sheet, road, dark mode

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace the `.nodes` / `.node` block**

Find the existing block starting at `.nodes { position: relative;` and ending at the end of the `.node--locked .node__disc { ... }` rule, and REPLACE from `.nodes {` through the pulse-ring rule (`.node--current::before { ... }`) with:

```css
.nodes { position: relative; margin: 0 auto; max-width: 300px; }
.nodes__road { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.road { fill: none; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.road--bg { stroke: var(--line); stroke-width: 6; stroke-dasharray: 2 12; }
.road--done { stroke: var(--green); stroke-width: 6; }

.node {
  position: absolute;
  transform: translateX(-50%);
  z-index: 1;
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
}
.node__disc {
  width: 68px; height: 68px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 28px;
  transition: transform .08s ease;
}
.node:active:not(:disabled) .node__disc { transform: translateY(4px); }
.node__label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 13px;
  color: var(--muted);
  max-width: 130px;
  text-align: center;
}
.node--current .node__disc {
  background: linear-gradient(180deg, #7ee63a, var(--green));
  color: #fff;
  box-shadow: 0 6px 0 var(--green-d);
  animation: nodeBounce 2.2s ease-in-out infinite;
}
.node--current .node__label { color: var(--green-d); }
.node--done .node__disc {
  background: linear-gradient(180deg, #ffd84d, var(--gold));
  color: #7a5c00;
  box-shadow: 0 6px 0 var(--gold-d);
}
.node--locked { cursor: default; }
.node--locked .node__disc { background: #ededed; color: #bdbdbd; box-shadow: 0 6px 0 #dcdcdc; }
```

(Removes the old flex-column `.nodes`, the old duplicate `.node*` rules, and the `.node--current::before` pulse ring — the bounce replaces it.)

- [ ] **Step 2: Add the answer sheet + match grid + keyframe at the end of the file (before the `@media (prefers-reduced-motion)` block)**

```css
/* answer sheet (lesson) */
.sheet {
  position: sticky;
  bottom: 0;
  margin: 18px -14px -40px;
  padding: 18px 16px 26px;
  animation: slideUp .22s ease both;
  display: flex; flex-direction: column; gap: 14px;
}
.sheet--correct { background: #d7ffb8; }
.sheet--wrong { background: #ffe0e0; }
.sheet__msg { display: flex; align-items: center; gap: 12px; font-family: var(--font-display); }
.sheet__badge { font-size: 26px; }
.sheet__msg strong { font-size: 18px; color: var(--ink-strong); }
.sheet--correct .sheet__msg strong { color: #3a8500; }
.sheet--wrong .sheet__msg strong { color: var(--red-d); }
.sheet__answer { font-weight: 700; color: var(--red-d); margin-top: 2px; }
.combo { margin-left: 10px; font-weight: 800; color: #ff7a00; }
.sheet--correct .btn { --c: var(--green); --cd: var(--green-d); }
.sheet--wrong .btn { --c: var(--red); --cd: var(--red-d); }

/* match two-column */
.match-grid { display: flex; gap: 10px; }
.match-col { flex: 1; }

@keyframes nodeBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
```

- [ ] **Step 3: Add dark-mode tokens at the end of the file (after the reduced-motion block)**

```css
/* dark mode (auto) — brand colors kept, surfaces/ink inverted */
@media (prefers-color-scheme: dark) {
  :root {
    --ink: #e7e7e7;
    --ink-strong: #f3f3f3;
    --muted: #8a8a8a;
    --line: #333638;
    --line-2: #2a2c2e;
    --card: #1b1d1f;
    --card-2: #232628;
  }
  body {
    background:
      radial-gradient(1200px 500px at 50% -10%, #10361c 0%, rgba(16, 54, 28, 0) 60%),
      radial-gradient(900px 500px at 110% 10%, #2a2410 0%, rgba(42, 36, 16, 0) 55%),
      #131516;
  }
  .stat, .path-hero, .choice, .token, .audio-btn { background: var(--card); }
  .header { background: linear-gradient(180deg, rgba(19,21,22,.96), rgba(19,21,22,.7)); }
  .choice:hover:not(:disabled) { background: #202a30; }
  .sheet--correct { background: #1d3311; }
  .sheet--wrong { background: #3a1a1a; }
  .node--locked .node__disc { background: #2a2c2e; color: #6a6a6a; box-shadow: 0 6px 0 #202223; }
  .action-bar { background: linear-gradient(0deg, #131516 60%, rgba(19,21,22,0)); }
}
```

- [ ] **Step 4: Build to verify CSS compiles + no JSX breakage**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 5: Full test suite**

Run: `npx vitest run`
Expected: PASS — 45 tests (previous 40 + 5 answerText).

- [ ] **Step 6: Commit**

```bash
git add src/styles.css
git commit -m "feat: node bounce, answer sheet, road connector, auto dark mode"
```

---

## Task 6: Live verification + push

**Files:** none (verification only)

- [ ] **Step 1: Start dev server**

Run (background): `npm run dev`
Confirm it prints `Local: http://localhost:5173/`.

- [ ] **Step 2: Drive a lesson end-to-end (manual or Playwright)**

Verify in a browser at `http://localhost:5173/`:
- Path shows a winding connector line threading the nodes; the current node gently bounces.
- Open a lesson, answer WRONG on purpose → red sheet appears showing `정답: <answer>` and a `계속` button; nothing advances until `계속` is tapped.
- Answer several correct in a row → green sheet shows `🔥 콤보 x2`, `x3` …
- The 확인 button sits in a sticky bottom bar for all four exercise types.
- Toggle OS dark mode → surfaces invert, brand green/gold preserved, text legible.
- Console has no errors.

- [ ] **Step 3: Stop dev server, final build**

Run: `npx vite build`
Expected: success.

- [ ] **Step 4: Push (auto-deploys via GitHub Pages Actions)**

```bash
git push origin main
```

Then confirm the deploy run succeeds: `gh run list --limit 1` → wait → conclusion `success`, and the live URL `https://jflakeee.github.io/duolingo_base/` reflects the changes.

---

## Self-Review Notes

- **Spec coverage (Phase 1 §3):** 1-1 커넥터 → Task 4; 1-2 바운스 → Task 5 (nodeBounce); 1-3 고정 확인바 → Task 2 (+WordBank/Listen already done); 1-4 오답시트+계속 → Task 3 (+answerText Task 1); 1-5 콤보 → Task 3; 1-6 다크모드 → Task 5.
- **Contract preserved:** exercise components keep `onAnswer(isCorrect)`; the correct-answer text is derived in `Lesson` via `correctAnswerText`, so `tests/exercises.test.jsx` is untouched.
- **Test-critical strings preserved:** `확인`, exercise words, lesson titles, `유치원` all unchanged → `tests/app.test.jsx` and `tests/exercises.test.jsx` stay green.
- **Type consistency:** `correctAnswerText(exercise)` used in Lesson matches the signature defined/tested in Task 1. Path geometry helpers `cx/cy/roadPath/donePath` are self-contained in Path.jsx.
- **Known deferral:** manual dark-mode toggle and progress-based road recomputation live in later phases; Phase 1 uses OS `prefers-color-scheme` and static per-segment done coloring.
```
