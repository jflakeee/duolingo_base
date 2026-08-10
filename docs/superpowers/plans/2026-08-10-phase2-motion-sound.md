# Phase 2 — 모션·사운드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add life to Lingo Duck — an animated mascot that reacts to answers, richer synthesized sound effects (correct arpeggio / soft wrong buzz / lesson-complete jingle), mobile haptics, and a more varied confetti celebration. All original, asset-free, CSP-safe.

**Architecture:** Sound and haptics are guarded modules that no-op when the browser API is missing (so they never crash under jsdom). Mascot motion is pure CSS keyframes driven by a prop. Everything respects `prefers-reduced-motion`.

**Tech Stack:** React 18, Vite 5, Vitest. Repo `C:\Users\a\orca\workspaces\lingoduck` (branch `main`, 45 tests passing). Git author flags on every commit: `git -c user.name="jflakeee" -c user.email="jflakeee@gmail.com" commit -m "..."`.

**Constraint:** Original content only (no third-party assets/melodies). Preserve existing exports `playCorrect`, `playWrong` (used by `Lesson.jsx`). Preserve all test-critical strings.

---

## Task 1: Richer synthesized sound (sfx.js)

**Files:**
- Modify: `src/audio/sfx.js`
- Test: `tests/sfx.test.js`

- [ ] **Step 1: Write failing test `tests/sfx.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { playCorrect, playWrong, playComplete } from '../src/audio/sfx.js'

// jsdom has no AudioContext → all sfx must be guarded no-ops that never throw.
describe('sfx (guarded)', () => {
  it('playCorrect does not throw without AudioContext', () => {
    expect(() => playCorrect()).not.toThrow()
  })
  it('playWrong does not throw', () => {
    expect(() => playWrong()).not.toThrow()
  })
  it('playComplete does not throw', () => {
    expect(() => playComplete()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/sfx.test.js`
Expected: FAIL — `playComplete` is not exported.

- [ ] **Step 3: Replace `src/audio/sfx.js`**

```js
let ctx = null
function ac() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

// note: [frequency, startOffset(s), duration(s), peakGain, type]
function play(notes) {
  const c = ac()
  if (!c) return
  const now = c.currentTime
  for (const [f, off, dur, peak = 0.18, type = 'sine'] of notes) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = f
    o.connect(g)
    g.connect(c.destination)
    const start = now + off
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(peak, start + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.start(start)
    o.stop(start + dur + 0.02)
  }
}

// bright ascending arpeggio (C5-E5-G5-C6)
export function playCorrect() {
  play([
    [523.25, 0.0, 0.14],
    [659.25, 0.07, 0.14],
    [783.99, 0.14, 0.16],
    [1046.5, 0.21, 0.22, 0.2],
  ])
}

// soft descending "try again" buzz (triangle, low)
export function playWrong() {
  play([
    [196.0, 0.0, 0.22, 0.16, 'triangle'],
    [155.56, 0.12, 0.28, 0.16, 'triangle'],
  ])
}

// short celebratory jingle (C-E-G-C-G-C, original)
export function playComplete() {
  play([
    [523.25, 0.0, 0.16],
    [659.25, 0.1, 0.16],
    [783.99, 0.2, 0.16],
    [1046.5, 0.3, 0.2],
    [783.99, 0.42, 0.14, 0.14],
    [1046.5, 0.5, 0.3, 0.2],
  ])
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/sfx.test.js`
Expected: PASS (3)

- [ ] **Step 5: Commit**

```bash
git add src/audio/sfx.js tests/sfx.test.js
git commit -m "feat: richer synthesized sfx + lesson-complete jingle"
```

---

## Task 2: Haptics (guarded) + wire into lesson

**Files:**
- Create: `src/audio/haptics.js`
- Test: `tests/haptics.test.js`
- Modify: `src/components/Lesson.jsx`

- [ ] **Step 1: Write failing test `tests/haptics.test.js`**

```js
import { describe, it, expect, vi, afterEach } from 'vitest'
import { buzzCorrect, buzzWrong } from '../src/audio/haptics.js'

afterEach(() => { delete navigator.vibrate })

describe('haptics (guarded)', () => {
  it('does not throw when navigator.vibrate is missing', () => {
    expect(() => buzzCorrect()).not.toThrow()
    expect(() => buzzWrong()).not.toThrow()
  })
  it('calls navigator.vibrate when available', () => {
    const spy = vi.fn()
    navigator.vibrate = spy
    buzzCorrect()
    buzzWrong()
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/haptics.test.js`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `src/audio/haptics.js`**

```js
function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* ignore */
  }
}

export function buzzCorrect() { vibrate(15) }
export function buzzWrong() { vibrate([0, 40, 40, 40]) }
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/haptics.test.js`
Expected: PASS (2)

- [ ] **Step 5: Wire into `src/components/Lesson.jsx`**

Add the import after the sfx import:

```jsx
import { playCorrect, playWrong } from '../audio/sfx.js'
import { buzzCorrect, buzzWrong } from '../audio/haptics.js'
```

Change the judge line inside `handleAnswer` from:

```jsx
    if (isCorrect) { playCorrect() } else { playWrong(); onWrong?.() }
```

to:

```jsx
    if (isCorrect) { playCorrect(); buzzCorrect() } else { playWrong(); buzzWrong(); onWrong?.() }
```

- [ ] **Step 6: Verify app tests still pass**

Run: `npx vitest run tests/app.test.jsx`
Expected: PASS (2)

- [ ] **Step 7: Commit**

```bash
git add src/audio/haptics.js tests/haptics.test.js src/components/Lesson.jsx
git commit -m "feat: guarded haptics on correct/wrong"
```

---

## Task 3: Animated mascot (Duck reactions)

**Files:**
- Modify: `src/components/Duck.jsx`
- Modify: `src/styles.css`

The duck should idle-blink always, and when given `animate="cheer"` do a happy jump, `animate="sad"` a shake. Pure CSS keyframes on SVG groups. No logic change to callers (existing `mood`/`bob` props kept; new optional `animate`).

- [ ] **Step 1: Update `src/components/Duck.jsx`**

Change the signature and root element to accept `animate` and wrap eyes in a blinking group. Replace the function signature line:

```jsx
export default function Duck({ mood = 'happy', size = 96, bob = false }) {
```

with:

```jsx
export default function Duck({ mood = 'happy', size = 96, bob = false, animate = null }) {
```

Replace the `<svg ...>` opening tag's `className` attribute:

```jsx
      className={bob ? 'bob' : undefined}
```

with:

```jsx
      className={[bob ? 'bob' : '', animate ? `duck-${animate}` : ''].filter(Boolean).join(' ') || undefined}
```

Wrap the two eye white+pupil circles in a blinking group. Replace this block:

```jsx
      {/* eyes (white + pupil) */}
      <circle cx="42" cy={eyeY} r="6.5" fill="#fff" />
      <circle cx="58" cy={eyeY} r="6.5" fill="#fff" />
      <circle cx={mood === 'cheer' ? 43 : 42} cy={eyeY + 1} r="3.2" fill="#3c3c3c" />
      <circle cx={mood === 'cheer' ? 59 : 58} cy={eyeY + 1} r="3.2" fill="#3c3c3c" />
```

with:

```jsx
      {/* eyes (white + pupil) — blinking group */}
      <g className="duck-eyes" style={{ transformOrigin: `50px ${eyeY}px` }}>
        <circle cx="42" cy={eyeY} r="6.5" fill="#fff" />
        <circle cx="58" cy={eyeY} r="6.5" fill="#fff" />
        <circle cx={mood === 'cheer' ? 43 : 42} cy={eyeY + 1} r="3.2" fill="#3c3c3c" />
        <circle cx={mood === 'cheer' ? 59 : 58} cy={eyeY + 1} r="3.2" fill="#3c3c3c" />
      </g>
```

- [ ] **Step 2: Add mascot keyframes to `src/styles.css`** (append before the `@media (prefers-reduced-motion)` block)

```css
/* mascot animation */
.duck-eyes { animation: blink 4.2s ease-in-out infinite; }
@keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
.duck-cheer { animation: duckJump .6s ease; }
@keyframes duckJump { 0% { transform: translateY(0) } 30% { transform: translateY(-14px) rotate(-4deg) } 55% { transform: translateY(0) } 72% { transform: translateY(-6px) } 100% { transform: translateY(0) } }
.duck-sad { animation: duckShake .5s ease; }
@keyframes duckShake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-6px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(4px) } }
```

- [ ] **Step 3: Use `animate` on the Result mascot.** In `src/components/Result.jsx`, change:

```jsx
      <Duck mood={perfect ? 'cheer' : 'happy'} size={128} bob />
```

to:

```jsx
      <Duck mood={perfect ? 'cheer' : 'happy'} size={128} bob animate="cheer" />
```

- [ ] **Step 4: Build to verify**

Run: `npx vite build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/components/Duck.jsx src/styles.css src/components/Result.jsx
git commit -m "feat: animated mascot (blink/jump/shake)"
```

---

## Task 4: Lesson-complete jingle + streak line + confetti variety

**Files:**
- Modify: `src/components/Result.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Play the jingle on the result screen.** In `src/components/Result.jsx`, add imports at top:

```jsx
import { useEffect } from 'react'
import { playComplete } from '../audio/sfx.js'
```

Inside the `Result` component body, before `return`, add:

```jsx
  useEffect(() => { playComplete() }, [])
```

- [ ] **Step 2: Show the streak in the result.** In `src/App.jsx`, change the Result render to pass streak:

```jsx
      {screen === 'result' && summary && (
        <Result summary={summary} streak={progress.streak.count} onContinue={goPath} />
      )}
```

In `src/components/Result.jsx`, accept `streak` and add a line under the stat cards (before the 계속 button). Change the signature:

```jsx
export default function Result({ summary, onContinue }) {
```

to:

```jsx
export default function Result({ summary, streak, onContinue }) {
```

and add, immediately before `<button className="btn" onClick={onContinue}>계속하기</button>`:

```jsx
      {streak > 0 && <p className="streak-line">🔥 {streak}일 연속 학습 중!</p>}
```

- [ ] **Step 3: Confetti variety.** In `src/components/Result.jsx` `Confetti`, vary width/height/radius per piece. Replace the `<i ... />` style object's fixed parts by adding size vars. Change:

```jsx
        style={{
          left: `${left}%`,
          background: color,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          transform: `rotate(${rot}deg)`,
        }}
```

to:

```jsx
        style={{
          left: `${left}%`,
          background: color,
          width: `${7 + Math.round(Math.random() * 6)}px`,
          height: `${10 + Math.round(Math.random() * 8)}px`,
          borderRadius: i % 3 === 0 ? '50%' : '2px',
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          transform: `rotate(${rot}deg)`,
        }}
```

- [ ] **Step 4: Style the streak line.** In `src/styles.css`, append (before reduced-motion block):

```css
.streak-line { font-family: var(--font-display); font-weight: 600; color: #ff7a00; margin: 6px 0 16px; }
```

- [ ] **Step 5: Build + full suite**

Run: `npx vite build` (success), then `npx vitest run`
Expected: 50 tests passing (45 prior + 3 sfx + 2 haptics).

- [ ] **Step 6: Commit**

```bash
git add src/components/Result.jsx src/App.jsx src/styles.css
git commit -m "feat: completion jingle, streak line, varied confetti"
```

---

## Task 5: Live verification + push

- [ ] **Step 1:** `npm run dev`, open the app, complete a lesson. Verify: answering plays distinct correct/wrong sounds (audible in a real browser); the result screen plays the jingle, the duck jumps and blinks, confetti varies, and the streak line shows. Console clean.
- [ ] **Step 2:** Stop dev, `npx vite build` (success).
- [ ] **Step 3:** `git push origin main`; confirm the Pages deploy run concludes `success` and the live URL updates.

---

## Self-Review Notes
- **Spec coverage (§4):** mascot animation → Task 3; richer sound → Task 1; haptics → Task 2; confetti variety + streak celebration → Task 4; reduced-motion → existing global rule covers new keyframes.
- **Backwards-compatible:** `playCorrect`/`playWrong` names kept; `Duck` new `animate` prop optional; `Result` new `streak` prop optional-safe (guarded `streak > 0`).
- **Testable slice:** sfx and haptics guarded no-op behavior is unit-tested; animation/audio timbre verified live.
```
