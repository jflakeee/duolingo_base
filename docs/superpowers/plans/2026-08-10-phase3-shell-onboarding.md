# Phase 3 — 구조·온보딩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give Lingo Duck an app shell like the original — a bottom 4-tab navigation (학습/퀘스트/상점/프로필), a first-run onboarding flow (welcome → daily goal → start level), a Profile screen with stats + settings (theme toggle, daily goal, reset), and placeholder Quests/Shop tabs (filled in Phase 4). Adds progress v2 fields and a theme engine that supports auto/light/dark.

**Architecture:** `App.jsx` becomes a shell holding a `tab` state; the Learn tab keeps the existing path→lesson→result→fail flow. Theme is driven by a `data-theme` attribute on `<html>` set from `settings.theme` (auto resolved via `matchMedia`), so dark mode works both automatically and via a manual toggle. New progress fields are additive — `loadProgress`'s merge migrates existing saves.

**Tech Stack:** React 18, Vite 5, Vitest. Repo `C:\Users\a\orca\workspaces\lingoduck` (branch `main`, 50 tests passing). Git author flags on every commit: `git -c user.name="jflakeee" -c user.email="jflakeee@gmail.com" commit -m "..."`.

**Constraint:** Original content only. Preserve all test-critical strings and the existing lesson flow. Existing tests must stay green.

---

## Task 1: progress v2 fields (TDD)

**Files:**
- Modify: `src/store/progress.js`
- Modify: `tests/progress.test.js`

- [ ] **Step 1: Add fields to `defaultProgress()` in `src/store/progress.js`.** Change the returned object from:

```js
  return {
    version: 1,
    xp: 0,
    hearts: START_HEARTS,
    heartsUpdatedAt: 0,
    streak: { count: 0, lastDay: null, freezes: 1 },
    completedLessons: [],
    dailyXp: { day: null, amount: 0 },
  }
```

to:

```js
  return {
    version: 2,
    xp: 0,
    hearts: START_HEARTS,
    heartsUpdatedAt: 0,
    streak: { count: 0, lastDay: null, freezes: 1 },
    completedLessons: [],
    dailyXp: { day: null, amount: 0 },
    gems: 0,
    dailyGoal: 50,
    onboarded: false,
    settings: { theme: 'auto' },
  }
```

- [ ] **Step 2: Add assertions to `tests/progress.test.js`** (append inside the existing `describe('progress store', ...)`):

```js
  it('defaults include v2 fields', () => {
    const p = defaultProgress()
    expect(p.gems).toBe(0)
    expect(p.dailyGoal).toBe(50)
    expect(p.onboarded).toBe(false)
    expect(p.settings).toEqual({ theme: 'auto' })
    expect(p.version).toBe(2)
  })
  it('migrates a v1 save by filling new fields', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, xp: 30 }))
    const p = loadProgress()
    expect(p.xp).toBe(30)
    expect(p.gems).toBe(0)
    expect(p.onboarded).toBe(false)
    expect(p.settings).toEqual({ theme: 'auto' })
  })
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/progress.test.js`
Expected: PASS (6 = 4 prior + 2 new)

- [ ] **Step 4: Commit**

```bash
git add src/store/progress.js tests/progress.test.js
git commit -m "feat: progress v2 fields (gems, dailyGoal, onboarded, settings)"
```

---

## Task 2: Theme engine + data-theme dark mode (TDD)

**Files:**
- Create: `src/engine/theme.js`
- Test: `tests/theme.test.js`
- Modify: `src/styles.css` (convert the dark block to `[data-theme="dark"]`)

- [ ] **Step 1: Write failing test `tests/theme.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { resolveTheme } from '../src/engine/theme.js'

describe('resolveTheme', () => {
  it('explicit dark/light win', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })
  it('auto follows the OS preference', () => {
    expect(resolveTheme('auto', true)).toBe('dark')
    expect(resolveTheme('auto', false)).toBe('light')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/theme.test.js`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `src/engine/theme.js`**

```js
// pure: decide the effective theme
export function resolveTheme(setting, prefersDark) {
  if (setting === 'dark') return 'dark'
  if (setting === 'light') return 'light'
  return prefersDark ? 'dark' : 'light' // 'auto'
}

// side-effect: stamp the html element (guarded for SSR/jsdom-less)
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

// current OS preference (guarded)
export function prefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/theme.test.js`
Expected: PASS (2)

- [ ] **Step 5: Convert the dark CSS block in `src/styles.css`.** Find the block that begins with:

```css
/* dark mode (auto) — brand colors kept, surfaces/ink inverted */
@media (prefers-color-scheme: dark) {
  :root {
```

Replace the ENTIRE `@media (prefers-color-scheme: dark) { ... }` block with the same rules but driven by `data-theme` (JS resolves auto). Use this exact replacement:

```css
/* dark mode — driven by data-theme (JS resolves 'auto' via matchMedia) */
:root[data-theme="dark"] {
  --ink: #e7e7e7;
  --ink-strong: #f3f3f3;
  --muted: #8a8a8a;
  --line: #333638;
  --line-2: #2a2c2e;
  --card: #1b1d1f;
  --card-2: #232628;
}
[data-theme="dark"] body {
  background:
    radial-gradient(1200px 500px at 50% -10%, #10361c 0%, rgba(16, 54, 28, 0) 60%),
    radial-gradient(900px 500px at 110% 10%, #2a2410 0%, rgba(42, 36, 16, 0) 55%),
    #131516;
}
[data-theme="dark"] .stat,
[data-theme="dark"] .path-hero,
[data-theme="dark"] .choice,
[data-theme="dark"] .token,
[data-theme="dark"] .audio-btn { background: var(--card); }
[data-theme="dark"] .header { background: linear-gradient(180deg, rgba(19,21,22,.96), rgba(19,21,22,.7)); }
[data-theme="dark"] .choice:hover:not(:disabled) { background: #202a30; }
[data-theme="dark"] .sheet--correct { background: #1d3311; }
[data-theme="dark"] .sheet--wrong { background: #3a1a1a; }
[data-theme="dark"] .node--locked .node__disc { background: #2a2c2e; color: #6a6a6a; box-shadow: 0 6px 0 #202223; }
[data-theme="dark"] .action-bar { background: linear-gradient(0deg, #131516 60%, rgba(19,21,22,0)); }
[data-theme="dark"] .bottomnav { background: #16181a; border-top-color: #2a2c2e; }
```

- [ ] **Step 6: Commit**

```bash
git add src/engine/theme.js tests/theme.test.js src/styles.css
git commit -m "feat: theme engine + data-theme dark mode"
```

---

## Task 3: Bottom tab nav + app shell (App refactor)

**Files:**
- Create: `src/components/BottomNav.jsx`
- Create: `src/components/Quests.jsx`, `src/components/Shop.jsx` (shells; Phase 4 fills them)
- Modify: `src/App.jsx`
- Modify: `src/styles.css` (nav + tab-screen styles)

- [ ] **Step 1: Create `src/components/BottomNav.jsx`**

```jsx
const TABS = [
  { id: 'learn', label: '학습', icon: '🏠' },
  { id: 'quests', label: '퀘스트', icon: '🎯' },
  { id: 'shop', label: '상점', icon: '🛒' },
  { id: 'profile', label: '프로필', icon: '👤' },
]

export default function BottomNav({ tab, onTab }) {
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`navbtn ${tab === t.id ? 'navbtn--active' : ''}`}
          onClick={() => onTab(t.id)}
        >
          <span className="navbtn__ico">{t.icon}</span>
          <span className="navbtn__label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Create `src/components/Quests.jsx`**

```jsx
import Duck from './Duck.jsx'

export default function Quests() {
  return (
    <div className="tabscreen">
      <h1>일일 퀘스트 🎯</h1>
      <div className="empty-card">
        <Duck mood="happy" size={84} bob />
        <p><strong>퀘스트가 곧 찾아와요!</strong></p>
        <p className="lede">매일 목표를 달성하고 젬을 모으게 될 거예요.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/Shop.jsx`**

```jsx
import Duck from './Duck.jsx'

export default function Shop({ progress }) {
  return (
    <div className="tabscreen">
      <h1>상점 🛒</h1>
      <p className="lede">보유 젬: 💎 {progress.gems}</p>
      <div className="empty-card">
        <Duck mood="cheer" size={84} bob />
        <p><strong>상점이 준비 중이에요!</strong></p>
        <p className="lede">곧 하트 리필과 스트릭 프리즈를 살 수 있어요.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace `src/App.jsx` entirely**

```jsx
import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Path from './components/Path.jsx'
import Lesson from './components/Lesson.jsx'
import Result from './components/Result.jsx'
import Duck from './components/Duck.jsx'
import BottomNav from './components/BottomNav.jsx'
import Quests from './components/Quests.jsx'
import Shop from './components/Shop.jsx'
import Profile from './components/Profile.jsx'
import Onboarding from './components/Onboarding.jsx'
import { getLessonById, getLevels } from './data/loadCurriculum.js'
import { loadProgress, saveProgress, resetProgress, defaultProgress } from './store/progress.js'
import { loseHeart, updateStreak, addDailyXp, regenHearts, msUntilNextHeart } from './engine/gamification.js'
import { resolveTheme, applyTheme, prefersDark } from './engine/theme.js'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const [progress, setProgress] = useState(() => {
    const p = loadProgress()
    const r = regenHearts(p.hearts, p.heartsUpdatedAt ?? Date.now(), Date.now())
    return { ...p, hearts: r.hearts, heartsUpdatedAt: r.heartsUpdatedAt }
  })
  const [tab, setTab] = useState('learn')
  const [screen, setScreen] = useState('path') // learn sub-screen: path|lesson|result|fail
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [summary, setSummary] = useState(null)

  // apply theme on mount + when the setting changes; follow OS when 'auto'
  useEffect(() => {
    const setting = progress.settings.theme
    applyTheme(resolveTheme(setting, prefersDark()))
    if (setting !== 'auto' || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(resolveTheme('auto', mq.matches))
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [progress.settings.theme])

  function persist(next) { setProgress(next); saveProgress(next) }

  function goTab(id) { setTab(id); if (id === 'learn') setScreen('path') }

  function startLesson(id) {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    setActiveLessonId(id)
    setScreen('lesson')
  }
  function handleWrong() {
    const wasFull = progress.hearts >= 5
    const next = { ...progress, hearts: loseHeart(progress.hearts), heartsUpdatedAt: wasFull ? Date.now() : progress.heartsUpdatedAt }
    persist(next)
    if (next.hearts <= 0) setScreen('fail')
  }
  function goPath() {
    const r = regenHearts(progress.hearts, progress.heartsUpdatedAt, Date.now())
    if (r.hearts !== progress.hearts) persist({ ...progress, hearts: r.hearts, heartsUpdatedAt: r.heartsUpdatedAt })
    setScreen('path')
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

  function handleOnboarded({ dailyGoal, startLevel }) {
    const levels = getLevels()
    const idx = levels.findIndex((l) => l.id === startLevel)
    const pre = []
    for (let i = 0; i < idx; i++) for (const u of levels[i].units) for (const l of u.lessons) pre.push(l.id)
    persist({ ...progress, onboarded: true, dailyGoal, completedLessons: pre })
  }
  function setTheme(theme) { persist({ ...progress, settings: { ...progress.settings, theme } }) }
  function setGoal(dailyGoal) { persist({ ...progress, dailyGoal }) }
  function resetKeepOnboarding() {
    const next = { ...defaultProgress(), onboarded: true, settings: progress.settings, dailyGoal: progress.dailyGoal }
    resetProgress(); persist(next); goTab('learn')
  }

  if (!progress.onboarded) return <Onboarding onDone={handleOnboarded} />

  const inLessonFlow = tab === 'learn' && screen !== 'path'
  const showHeader = !(tab === 'learn' && screen === 'lesson')
  const showNav = !inLessonFlow

  return (
    <div className="app">
      {showHeader && <Header progress={progress} />}

      {tab === 'learn' && (
        <>
          {screen === 'path' && <Path progress={progress} onStart={startLesson} />}
          {screen === 'lesson' && (
            <Lesson lesson={getLessonById(activeLessonId)} onWrong={handleWrong} onFinish={handleFinish} onQuit={() => setScreen('path')} />
          )}
          {screen === 'result' && summary && (
            <Result summary={summary} streak={progress.streak.count} onContinue={goPath} />
          )}
          {screen === 'fail' && (
            <div className="fail">
              <Duck mood="sad" size={128} />
              <h2>하트가 없어요 💔</h2>
              <p>잠시 후 다시 도전하거나 프로필에서 초기화할 수 있어요.</p>
              <p>다음 하트까지 약 {Math.ceil(msUntilNextHeart(progress.hearts, progress.heartsUpdatedAt, Date.now()) / 60000)}분</p>
              <div style={{ marginTop: 20 }}><button className="btn" onClick={goPath}>경로로 돌아가기</button></div>
            </div>
          )}
        </>
      )}

      {tab === 'quests' && <Quests progress={progress} />}
      {tab === 'shop' && <Shop progress={progress} />}
      {tab === 'profile' && (
        <Profile progress={progress} onSetTheme={setTheme} onSetGoal={setGoal} onReset={resetKeepOnboarding} />
      )}

      {showNav && <BottomNav tab={tab} onTab={goTab} />}
    </div>
  )
}
```

- [ ] **Step 5: Add nav + tab-screen styles to `src/styles.css`** (append before the reduced-motion block)

```css
/* bottom tab nav */
.app { padding-bottom: 78px; }
.bottomnav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  max-width: 460px; margin: 0 auto;
  display: flex; background: #fff; border-top: 2px solid var(--line-2);
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
}
.navbtn {
  flex: 1; border: none; background: transparent;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 4px; border-radius: 12px; color: var(--muted);
  font-family: var(--font-display); font-weight: 600; font-size: 11px;
}
.navbtn__ico { font-size: 22px; filter: grayscale(1) opacity(.7); transition: filter .15s; }
.navbtn--active { color: var(--green-d); background: #eafce0; }
.navbtn--active .navbtn__ico { filter: none; }

/* generic tab screens */
.tabscreen { padding: 8px 2px 20px; }
.tabscreen h1 { font-size: 24px; margin: 8px 0 6px; }
.empty-card {
  text-align: center; background: var(--card); border: 2px solid var(--line-2);
  border-radius: 20px; padding: 26px 18px; margin-top: 16px; box-shadow: 0 3px 0 var(--line);
}
.empty-card p { margin: 6px 0; }
```

- [ ] **Step 6: Update `tests/app.test.jsx` to seed an onboarded state.** The new onboarding gate makes a fresh `<App/>` render the Onboarding flow, so the smoke test must start already-onboarded. Replace the existing `beforeEach(() => localStorage.clear())` line with:

```jsx
import { STORAGE_KEY } from '../src/store/progress.js'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, onboarded: true }))
})
```

(Keep the existing two `it(...)` tests unchanged — with `onboarded: true` seeded, `<App/>` renders the learn path so `유치원` and the enabled `Hello` node still assert correctly.)

- [ ] **Step 7: Note on building.** `App.jsx` imports `Profile.jsx`, which is created in Task 4. Do NOT build or run the full suite at the end of Task 3 — it will fail on the missing import. Only run the targeted `tests/progress.test.js`/`tests/theme.test.js` if needed. The build + `tests/app.test.jsx` + full suite are verified in Task 4 Step 4, after Profile exists.

- [ ] **Step 8: Commit**

```bash
git add src/components/BottomNav.jsx src/components/Quests.jsx src/components/Shop.jsx src/App.jsx src/styles.css tests/app.test.jsx
git commit -m "feat: app shell with bottom 4-tab navigation"
```

---

## Task 4: Onboarding + Profile

**Files:**
- Create: `src/components/Onboarding.jsx`
- Create: `src/components/Profile.jsx`
- Modify: `src/styles.css` (onboarding + profile styles)

- [ ] **Step 1: Create `src/components/Profile.jsx`**

```jsx
import Duck from './Duck.jsx'

function Stat({ k, v }) {
  return (
    <div className="pstat">
      <div className="pstat__v">{v}</div>
      <div className="pstat__k">{k}</div>
    </div>
  )
}

export default function Profile({ progress, onSetTheme, onSetGoal, onReset }) {
  return (
    <div className="tabscreen profile">
      <div className="profile__hero">
        <Duck mood="happy" size={80} bob />
        <div>
          <h1>내 학습</h1>
          <p className="lede">꾸준히 나아가고 있어요!</p>
        </div>
      </div>

      <div className="stat-grid">
        <Stat k="총 XP" v={progress.xp} />
        <Stat k="스트릭" v={`${progress.streak.count}일`} />
        <Stat k="완료 레슨" v={progress.completedLessons.length} />
        <Stat k="젬" v={progress.gems} />
      </div>

      <h2 className="section-title">설정</h2>
      <div className="setting-row">
        <span>테마</span>
        <div className="seg">
          {[['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(([t, label]) => (
            <button key={t} className={`seg__btn ${progress.settings.theme === t ? 'seg__btn--on' : ''}`}
              onClick={() => onSetTheme(t)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="setting-row">
        <span>하루 목표</span>
        <div className="seg">
          {[10, 20, 50, 100].map((g) => (
            <button key={g} className={`seg__btn ${progress.dailyGoal === g ? 'seg__btn--on' : ''}`}
              onClick={() => onSetGoal(g)}>{g}</button>
          ))}
        </div>
      </div>

      <button className="btn btn--ghost" style={{ marginTop: 18 }} onClick={onReset}>진도 초기화</button>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/Onboarding.jsx`**

```jsx
import { useState } from 'react'
import Duck from './Duck.jsx'

const GOALS = [
  { xp: 10, label: '가볍게' },
  { xp: 20, label: '보통' },
  { xp: 50, label: '진지하게' },
  { xp: 100, label: '최대로' },
]
const LEVELS = [
  { id: 'kinder', label: '유치원', desc: '처음 시작해요' },
  { id: 'grade1', label: '초등 1학년', desc: '기초는 알아요' },
  { id: 'grade2', label: '초등 2학년', desc: '문장도 만들 수 있어요' },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(50)

  return (
    <div className="app onboarding">
      {step === 0 && (
        <div className="ob-step">
          <Duck mood="cheer" size={150} bob animate="cheer" />
          <h1>안녕! 나는 덕이 🦆</h1>
          <p className="lede">매일 조금씩, 영어가 즐거워져요.</p>
          <button className="btn" onClick={() => setStep(1)}>시작하기</button>
        </div>
      )}
      {step === 1 && (
        <div className="ob-step">
          <h1>하루 목표를 골라요</h1>
          <p className="lede">언제든 프로필에서 바꿀 수 있어요.</p>
          {GOALS.map((g) => (
            <button key={g.xp} className={`choice ${goal === g.xp ? 'selected' : ''}`} onClick={() => setGoal(g.xp)}>
              {g.label} · 하루 {g.xp} XP
            </button>
          ))}
          <div className="action-bar"><button className="btn" onClick={() => setStep(2)}>다음</button></div>
        </div>
      )}
      {step === 2 && (
        <div className="ob-step">
          <h1>어디서 시작할까요?</h1>
          <p className="lede">고른 단계 이전은 완료 처리되어 열려요.</p>
          {LEVELS.map((l) => (
            <button key={l.id} className="choice" onClick={() => onDone({ dailyGoal: goal, startLevel: l.id })}>
              <strong>{l.label}</strong> — {l.desc}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add onboarding + profile styles to `src/styles.css`** (append before the reduced-motion block)

```css
/* onboarding */
.onboarding { justify-content: center; }
.ob-step { text-align: center; animation: fadeUp .35s ease both; padding-top: 20px; }
.ob-step h1 { font-size: 26px; margin: 14px 0 6px; }
.ob-step .choice { text-align: center; }
.ob-step .btn { margin-top: 8px; }

/* profile */
.profile__hero { display: flex; align-items: center; gap: 14px; margin: 6px 0 18px; }
.profile__hero h1 { margin: 0; font-size: 24px; }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pstat { background: var(--card); border: 2px solid var(--line-2); border-radius: 16px; padding: 16px; box-shadow: 0 3px 0 var(--line); }
.pstat__v { font-family: var(--font-display); font-weight: 700; font-size: 26px; color: var(--green-d); }
.pstat__k { color: var(--muted); font-weight: 700; font-size: 13px; }
.section-title { font-size: 18px; margin: 22px 0 10px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; }
.seg { display: inline-flex; background: var(--card-2); border-radius: 12px; padding: 3px; }
.seg__btn { border: none; background: transparent; padding: 8px 12px; border-radius: 9px; font-weight: 700; color: var(--muted); font-size: 13px; }
.seg__btn--on { background: var(--green); color: #fff; }
```

- [ ] **Step 4: Build + full suite**

Run: `npx vite build` (must succeed now that Profile exists), then `npx vitest run`
Expected: build OK; 56 tests passing (50 prior + 2 progress + 2 theme; note Tasks 1–2 added 4). Confirm the exact count and that all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Onboarding.jsx src/components/Profile.jsx src/styles.css
git commit -m "feat: onboarding flow + profile screen"
```

---

## Task 5: Live verification + push

- [ ] **Step 1:** `npm run dev`. In a browser with cleared `localStorage` (`localStorage.clear()` then reload): the onboarding flow appears (welcome → goal → start level). Pick 유치원 → land on the learn path. Bottom nav shows 4 tabs; switching to 퀘스트/상점/프로필 works; entering a lesson hides the nav + header; Profile theme toggle switches light/dark live (html `data-theme` changes); daily goal change reflects in the header goal bar; reset returns to a fresh path without re-triggering onboarding.
- [ ] **Step 2:** Console clean. Stop dev, `npx vite build` (success).
- [ ] **Step 3:** `git push origin main`; confirm the Pages deploy concludes `success` and the live URL shows the tab bar.

---

## Self-Review Notes
- **Spec coverage (§5):** 4-tab shell → Task 3; onboarding(min: goal + start level) → Task 4 + `handleOnboarded`; profile stats+settings(theme/goal/reset) → Task 4 + App handlers; Quests/Shop shells → Task 3.
- **Theme:** `resolveTheme` unit-tested; auto follows `matchMedia` with a live listener; manual toggle persists via `settings.theme`; CSS keys off `data-theme`.
- **Migration:** v2 fields additive; `loadProgress` merge fills them for existing saves (unit-tested in Task 1).
- **Flow preserved:** learn path→lesson→result→fail unchanged; nav/header hidden during a lesson. Reset keeps `onboarded` true so users don't re-onboard.
- **Ordering caveat:** App (Task 3) imports Profile (Task 4). Build is deferred to Task 4 Step 4; `tests/app.test.jsx` is only asserted green after Profile exists. A subagent doing Task 3 then Task 4 in order satisfies this.
```
