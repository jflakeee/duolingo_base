# Phase 4 — 게임요소 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the original-style meta-game: a gem currency earned from lessons, a shop to spend gems (heart refill, streak freeze), daily quests with claimable rewards that reset at midnight, and achievement badges. All local, no backend, no leagues/leaderboards.

**Architecture:** Every rule is a pure function in `engine/` (economy, quests, achievements), unit-tested with Vitest. `App.jsx` wires events (lesson finish awards gems/quest-progress/achievements; shop/quest actions mutate progress). The Quests/Shop shells from Phase 3 become real screens; Profile gains an achievements grid.

**Tech Stack:** React 18, Vite 5, Vitest. Repo `C:\Users\a\orca\workspaces\lingoduck` (branch `main`, 54 tests passing). Git author flags on every commit: `git -c user.name="jflakeee" -c user.email="jflakeee@gmail.com" commit -m "..."`.

**Values (spec §8 defaults):** lesson +2 gems, perfect +3 bonus, heart refill 350 gems, streak freeze 200 gems (max 2). Quest rewards: XP quest 10, lessons quest 10, perfect quest 15.

**Constraint:** Original content only. Preserve existing tests and lesson flow.

---

## Task 1: progress fields for gamification (TDD)

**Files:**
- Modify: `src/store/progress.js`
- Modify: `tests/progress.test.js`

- [ ] **Step 1: Add three fields to `defaultProgress()`** (after `settings: { theme: 'auto' },`):

```js
    quests: { day: null, items: [] },
    achievements: {},
    perfectCount: 0,
```

- [ ] **Step 2: Add assertion to `tests/progress.test.js`** (inside the existing describe):

```js
  it('defaults include gamification fields', () => {
    const p = defaultProgress()
    expect(p.quests).toEqual({ day: null, items: [] })
    expect(p.achievements).toEqual({})
    expect(p.perfectCount).toBe(0)
  })
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/progress.test.js`
Expected: PASS (7)

- [ ] **Step 4: Commit**

```bash
git add src/store/progress.js tests/progress.test.js
git commit -m "feat: progress fields for quests/achievements/perfectCount"
```

---

## Task 2: Economy engine (TDD)

**Files:**
- Create: `src/engine/economy.js`
- Test: `tests/economy.test.js`

- [ ] **Step 1: Write failing test `tests/economy.test.js`**

```js
import { describe, it, expect } from 'vitest'
import {
  gemsForLesson, buyHeartRefill, buyStreakFreeze,
  PRICE_HEART_REFILL, PRICE_STREAK_FREEZE, MAX_FREEZES,
} from '../src/engine/economy.js'

describe('gemsForLesson', () => {
  it('base 2, +3 on perfect', () => {
    expect(gemsForLesson({ mistakes: 1 })).toBe(2)
    expect(gemsForLesson({ mistakes: 0 })).toBe(5)
  })
})

describe('buyHeartRefill', () => {
  it('refills to 5 and deducts price', () => {
    expect(buyHeartRefill(PRICE_HEART_REFILL, 2)).toEqual({ ok: true, gems: 0, hearts: 5 })
  })
  it('fails when hearts full', () => {
    expect(buyHeartRefill(999, 5)).toEqual({ ok: false, gems: 999, hearts: 5 })
  })
  it('fails when too few gems', () => {
    expect(buyHeartRefill(10, 1)).toEqual({ ok: false, gems: 10, hearts: 1 })
  })
})

describe('buyStreakFreeze', () => {
  it('adds a freeze and deducts price', () => {
    expect(buyStreakFreeze(PRICE_STREAK_FREEZE, 0)).toEqual({ ok: true, gems: 0, freezes: 1 })
  })
  it('fails at the cap', () => {
    expect(buyStreakFreeze(999, MAX_FREEZES)).toEqual({ ok: false, gems: 999, freezes: MAX_FREEZES })
  })
  it('fails when too few gems', () => {
    expect(buyStreakFreeze(10, 0)).toEqual({ ok: false, gems: 10, freezes: 0 })
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/economy.test.js`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `src/engine/economy.js`**

```js
import { START_HEARTS } from './gamification.js'

export const GEM_PER_LESSON = 2
export const GEM_PERFECT_BONUS = 3
export const PRICE_HEART_REFILL = 350
export const PRICE_STREAK_FREEZE = 200
export const MAX_FREEZES = 2

export function gemsForLesson({ mistakes }) {
  return GEM_PER_LESSON + (mistakes === 0 ? GEM_PERFECT_BONUS : 0)
}

export function buyHeartRefill(gems, hearts) {
  if (hearts >= START_HEARTS || gems < PRICE_HEART_REFILL) return { ok: false, gems, hearts }
  return { ok: true, gems: gems - PRICE_HEART_REFILL, hearts: START_HEARTS }
}

export function buyStreakFreeze(gems, freezes) {
  if (freezes >= MAX_FREEZES || gems < PRICE_STREAK_FREEZE) return { ok: false, gems, freezes }
  return { ok: true, gems: gems - PRICE_STREAK_FREEZE, freezes: freezes + 1 }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/economy.test.js`
Expected: PASS (7)

- [ ] **Step 5: Commit**

```bash
git add src/engine/economy.js tests/economy.test.js
git commit -m "feat: gem economy (earn + shop purchases)"
```

---

## Task 3: Quests engine (TDD)

**Files:**
- Create: `src/engine/quests.js`
- Test: `tests/quests.test.js`

- [ ] **Step 1: Write failing test `tests/quests.test.js`**

```js
import { describe, it, expect } from 'vitest'
import {
  makeDailyQuests, ensureQuests, applyLessonToQuests, isComplete, claimQuest,
} from '../src/engine/quests.js'

describe('quests', () => {
  it('makeDailyQuests returns 3 fresh items for the day', () => {
    const q = makeDailyQuests('2026-08-10')
    expect(q.day).toBe('2026-08-10')
    expect(q.items).toHaveLength(3)
    expect(q.items.every((i) => i.progress === 0 && i.claimed === false)).toBe(true)
  })
  it('ensureQuests regenerates on a new day, keeps same-day', () => {
    const q = makeDailyQuests('2026-08-09')
    expect(ensureQuests(q, '2026-08-09')).toBe(q)
    expect(ensureQuests(q, '2026-08-10').day).toBe('2026-08-10')
    expect(ensureQuests(null, '2026-08-10').day).toBe('2026-08-10')
    expect(ensureQuests({ day: null, items: [] }, '2026-08-10').day).toBe('2026-08-10')
  })
  it('applyLessonToQuests advances xp/lessons/perfect and caps', () => {
    let q = makeDailyQuests('2026-08-10')
    q = applyLessonToQuests(q, { xpGained: 70, perfect: true })
    const xp = q.items.find((i) => i.type === 'earnXp')
    const lessons = q.items.find((i) => i.type === 'lessons')
    const perfect = q.items.find((i) => i.type === 'perfect')
    expect(xp.progress).toBe(xp.target)      // capped at target
    expect(lessons.progress).toBe(1)
    expect(perfect.progress).toBe(1)
  })
  it('non-perfect lesson does not advance the perfect quest', () => {
    let q = makeDailyQuests('2026-08-10')
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    expect(q.items.find((i) => i.type === 'perfect').progress).toBe(0)
  })
  it('claimQuest rewards a complete unclaimed quest once', () => {
    let q = makeDailyQuests('2026-08-10')
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    const lessons = q.items.find((i) => i.type === 'lessons')
    // lessons target is 3; make it complete
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    q = applyLessonToQuests(q, { xpGained: 10, perfect: false })
    expect(isComplete(q.items.find((i) => i.type === 'lessons'))).toBe(true)
    const r1 = claimQuest(q, 'lessons')
    expect(r1.reward).toBe(lessons.reward)
    expect(r1.quests.items.find((i) => i.id === 'lessons').claimed).toBe(true)
    const r2 = claimQuest(r1.quests, 'lessons')
    expect(r2.reward).toBe(0) // already claimed
  })
  it('claimQuest on an incomplete quest gives nothing', () => {
    const q = makeDailyQuests('2026-08-10')
    expect(claimQuest(q, 'perfect').reward).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/quests.test.js`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `src/engine/quests.js`**

```js
export const QUEST_DEFS = [
  { id: 'xp', type: 'earnXp', target: 30, reward: 10, label: '오늘 30 XP 벌기' },
  { id: 'lessons', type: 'lessons', target: 3, reward: 10, label: '레슨 3개 완료' },
  { id: 'perfect', type: 'perfect', target: 1, reward: 15, label: '완벽한 레슨 1개' },
]

export function makeDailyQuests(day) {
  return {
    day,
    items: QUEST_DEFS.map((q) => ({
      id: q.id, type: q.type, target: q.target, reward: q.reward, label: q.label,
      progress: 0, claimed: false,
    })),
  }
}

export function ensureQuests(quests, today) {
  if (!quests || quests.day !== today || !quests.items || quests.items.length === 0) {
    return makeDailyQuests(today)
  }
  return quests
}

export function applyLessonToQuests(quests, { xpGained, perfect }) {
  const items = quests.items.map((q) => {
    let p = q.progress
    if (q.type === 'earnXp') p += xpGained
    if (q.type === 'lessons') p += 1
    if (q.type === 'perfect' && perfect) p += 1
    return { ...q, progress: Math.min(p, q.target) }
  })
  return { ...quests, items }
}

export function isComplete(item) {
  return item.progress >= item.target
}

export function claimQuest(quests, id) {
  const item = quests.items.find((q) => q.id === id)
  if (!item || !isComplete(item) || item.claimed) return { quests, reward: 0 }
  const items = quests.items.map((q) => (q.id === id ? { ...q, claimed: true } : q))
  return { quests: { ...quests, items }, reward: item.reward }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/quests.test.js`
Expected: PASS (6)

- [ ] **Step 5: Commit**

```bash
git add src/engine/quests.js tests/quests.test.js
git commit -m "feat: daily quests engine"
```

---

## Task 4: Achievements engine (TDD)

**Files:**
- Create: `src/engine/achievements.js`
- Test: `tests/achievements.test.js`

- [ ] **Step 1: Write failing test `tests/achievements.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, newlyUnlocked } from '../src/engine/achievements.js'

const base = {
  xp: 0, streak: { count: 0 }, completedLessons: [], perfectCount: 0, achievements: {},
}

describe('achievements', () => {
  it('exposes a non-empty list', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(4)
  })
  it('unlocks first lesson', () => {
    const p = { ...base, completedLessons: ['a'] }
    expect(newlyUnlocked(p)).toContain('first')
  })
  it('unlocks streak7 and xp500', () => {
    const p = { ...base, streak: { count: 7 }, xp: 500, completedLessons: ['a'] }
    const ids = newlyUnlocked(p)
    expect(ids).toContain('streak7')
    expect(ids).toContain('xp500')
  })
  it('does not re-unlock already-earned achievements', () => {
    const p = { ...base, completedLessons: ['a'], achievements: { first: '2026-08-01' } }
    expect(newlyUnlocked(p)).not.toContain('first')
  })
  it('returns nothing for a fresh profile', () => {
    expect(newlyUnlocked(base)).toEqual([])
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/achievements.test.js`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `src/engine/achievements.js`**

```js
export const ACHIEVEMENTS = [
  { id: 'first', label: '첫 걸음', desc: '첫 레슨 완료', icon: '🐣', test: (p) => p.completedLessons.length >= 1 },
  { id: 'lessons10', label: '성실한 학습자', desc: '레슨 10개 완료', icon: '📚', test: (p) => p.completedLessons.length >= 10 },
  { id: 'streak7', label: '일주일 개근', desc: '스트릭 7일', icon: '🔥', test: (p) => p.streak.count >= 7 },
  { id: 'xp500', label: 'XP 수집가', desc: '누적 500 XP', icon: '⭐', test: (p) => p.xp >= 500 },
  { id: 'perfect10', label: '완벽주의자', desc: '완벽한 레슨 10회', icon: '💎', test: (p) => (p.perfectCount || 0) >= 10 },
]

// ids of achievements whose condition is met but not yet recorded as unlocked
export function newlyUnlocked(progress) {
  const unlocked = progress.achievements || {}
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.test(progress)).map((a) => a.id)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/achievements.test.js`
Expected: PASS (5)

- [ ] **Step 5: Commit**

```bash
git add src/engine/achievements.js tests/achievements.test.js
git commit -m "feat: achievements engine"
```

---

## Task 5: Wire gamification into App + Header

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Add imports to `src/App.jsx`** (after the theme import line):

```js
import { gemsForLesson, buyHeartRefill, buyStreakFreeze } from './engine/economy.js'
import { ensureQuests, applyLessonToQuests, claimQuest as claimQuestReward } from './engine/quests.js'
import { newlyUnlocked } from './engine/achievements.js'
```

- [ ] **Step 2: Ensure quests on load.** In the `useState` initializer for `progress`, change the returned object from:

```js
    return { ...p, hearts: r.hearts, heartsUpdatedAt: r.heartsUpdatedAt }
```

to:

```js
    return { ...p, hearts: r.hearts, heartsUpdatedAt: r.heartsUpdatedAt, quests: ensureQuests(p.quests, todayStr()) }
```

- [ ] **Step 3: Award gems/quests/achievements in `handleFinish`.** Replace the whole `handleFinish` function with:

```js
  function handleFinish(s) {
    const today = todayStr()
    const perfect = s.mistakes === 0
    const gemsGained = gemsForLesson({ mistakes: s.mistakes })
    const afterLesson = {
      ...progress,
      xp: progress.xp + s.xpGained,
      gems: progress.gems + gemsGained,
      perfectCount: (progress.perfectCount || 0) + (perfect ? 1 : 0),
      dailyXp: addDailyXp(progress.dailyXp, s.xpGained, today),
      streak: updateStreak(progress.streak, today),
      completedLessons: progress.completedLessons.includes(activeLessonId)
        ? progress.completedLessons
        : [...progress.completedLessons, activeLessonId],
      quests: applyLessonToQuests(ensureQuests(progress.quests, today), { xpGained: s.xpGained, perfect }),
    }
    const newIds = newlyUnlocked(afterLesson)
    const achievements = { ...afterLesson.achievements }
    for (const id of newIds) achievements[id] = today
    const next = { ...afterLesson, achievements }
    persist(next)
    setSummary({ ...s, gemsGained, newAchievements: newIds })
    setScreen('result')
  }
```

- [ ] **Step 4: Ensure quests after onboarding.** In `handleOnboarded`, change the `persist(...)` call from:

```js
    persist({ ...progress, onboarded: true, dailyGoal, completedLessons: pre })
```

to:

```js
    persist({ ...progress, onboarded: true, dailyGoal, completedLessons: pre, quests: ensureQuests(progress.quests, todayStr()) })
```

- [ ] **Step 5: Add claim + buy handlers** (place after `resetKeepOnboarding`):

```js
  function claimQuest(id) {
    const today = todayStr()
    const q = ensureQuests(progress.quests, today)
    const { quests, reward } = claimQuestReward(q, id)
    persist({ ...progress, quests, gems: progress.gems + reward })
  }
  function buyHearts() {
    const r = buyHeartRefill(progress.gems, progress.hearts)
    if (r.ok) persist({ ...progress, gems: r.gems, hearts: r.hearts })
  }
  function buyFreeze() {
    const r = buyStreakFreeze(progress.gems, progress.streak.freezes)
    if (r.ok) persist({ ...progress, gems: r.gems, streak: { ...progress.streak, freezes: r.freezes } })
  }
```

- [ ] **Step 6: Pass handlers to the tab screens.** Replace the quests/shop render lines:

```jsx
      {tab === 'quests' && <Quests progress={progress} />}
      {tab === 'shop' && <Shop progress={progress} />}
```

with:

```jsx
      {tab === 'quests' && <Quests progress={progress} onClaim={claimQuest} />}
      {tab === 'shop' && <Shop progress={progress} onBuyHearts={buyHearts} onBuyFreeze={buyFreeze} />}
```

- [ ] **Step 7: Add a gems chip to `src/components/Header.jsx`.** Add it after the XP stat span:

```jsx
      <span className="stat stat--gem"><span className="ico">💎</span>{progress.gems}</span>
```

- [ ] **Step 8: Build + app tests**

Run: `npx vite build` (success), `npx vitest run tests/app.test.jsx` (2 pass)

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/components/Header.jsx
git commit -m "feat: wire gems/quests/achievements into app + header gem chip"
```

---

## Task 6: Quests / Shop / Profile screens + Result rewards

**Files:**
- Modify: `src/components/Quests.jsx`, `src/components/Shop.jsx`, `src/components/Profile.jsx`, `src/components/Result.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Replace `src/components/Quests.jsx`**

```jsx
export default function Quests({ progress, onClaim }) {
  const items = progress.quests?.items ?? []
  return (
    <div className="tabscreen">
      <h1>일일 퀘스트 🎯</h1>
      <p className="lede">자정에 새로 시작돼요.</p>
      {items.map((q) => {
        const pct = Math.min(100, Math.round((q.progress / q.target) * 100))
        const done = q.progress >= q.target
        return (
          <div key={q.id} className="quest">
            <div className="quest__top">
              <span>{q.label}</span>
              <span className="quest__reward">💎 {q.reward}</span>
            </div>
            <div className="progress"><i style={{ width: `${pct}%` }} /></div>
            <div className="quest__foot">
              <span className="quest__count">{q.progress}/{q.target}</span>
              <button className="btn btn--sm btn--gold" disabled={!done || q.claimed} onClick={() => onClaim(q.id)}>
                {q.claimed ? '받음 ✓' : '받기'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/components/Shop.jsx`**

```jsx
import { PRICE_HEART_REFILL, PRICE_STREAK_FREEZE, MAX_FREEZES } from '../engine/economy.js'

export default function Shop({ progress, onBuyHearts, onBuyFreeze }) {
  const heartsFull = progress.hearts >= 5
  const freezeFull = progress.streak.freezes >= MAX_FREEZES
  return (
    <div className="tabscreen">
      <h1>상점 🛒</h1>
      <p className="lede">보유 젬: 💎 {progress.gems}</p>

      <div className="shop-item">
        <div className="shop-item__ico">❤️</div>
        <div className="shop-item__body">
          <strong>하트 가득 채우기</strong>
          <p className="lede">{heartsFull ? '이미 가득 찼어요' : '하트를 5개로 회복'}</p>
        </div>
        <button className="btn btn--sm" disabled={heartsFull || progress.gems < PRICE_HEART_REFILL} onClick={onBuyHearts}>
          💎 {PRICE_HEART_REFILL}
        </button>
      </div>

      <div className="shop-item">
        <div className="shop-item__ico">🧊</div>
        <div className="shop-item__body">
          <strong>스트릭 프리즈</strong>
          <p className="lede">결석 하루를 보호해요 (최대 {MAX_FREEZES}개, 보유 {progress.streak.freezes})</p>
        </div>
        <button className="btn btn--sm btn--blue" disabled={freezeFull || progress.gems < PRICE_STREAK_FREEZE} onClick={onBuyFreeze}>
          💎 {PRICE_STREAK_FREEZE}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add an achievements grid to `src/components/Profile.jsx`.** Add the import at top:

```jsx
import { ACHIEVEMENTS } from '../engine/achievements.js'
```

and insert this block immediately BEFORE the `<h2 className="section-title">설정</h2>` line:

```jsx
      <h2 className="section-title">업적</h2>
      <div className="badges">
        {ACHIEVEMENTS.map((a) => {
          const on = !!progress.achievements?.[a.id]
          return (
            <div key={a.id} className={`badge-card ${on ? '' : 'badge-card--locked'}`}>
              <div className="badge-card__ico">{on ? a.icon : '🔒'}</div>
              <div className="badge-card__label">{a.label}</div>
            </div>
          )
        })}
      </div>
```

- [ ] **Step 4: Show gem reward on `src/components/Result.jsx`.** Insert immediately BEFORE the `{streak > 0 && ...}` line:

```jsx
      {summary.gemsGained > 0 && <p className="gem-line">💎 +{summary.gemsGained} 젬 획득</p>}
      {summary.newAchievements?.length > 0 && <p className="ach-line">🏆 새 업적 {summary.newAchievements.length}개 달성!</p>}
```

- [ ] **Step 5: Add styles to `src/styles.css`** (append before the reduced-motion block)

```css
.stat--gem { color: #1899d6; }

/* quests */
.quest { background: var(--card); border: 2px solid var(--line-2); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 3px 0 var(--line); }
.quest__top { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 8px; }
.quest__reward { color: #1899d6; font-family: var(--font-display); font-weight: 600; }
.quest__foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.quest__count { color: var(--muted); font-weight: 700; font-size: 13px; }

/* shop */
.shop-item { display: flex; align-items: center; gap: 12px; background: var(--card); border: 2px solid var(--line-2); border-radius: 16px; padding: 14px; margin-bottom: 12px; box-shadow: 0 3px 0 var(--line); }
.shop-item__ico { font-size: 30px; }
.shop-item__body { flex: 1; }
.shop-item__body strong { display: block; }
.shop-item .btn { width: auto; }

/* badges */
.badges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.badge-card { text-align: center; background: var(--card); border: 2px solid var(--line-2); border-radius: 14px; padding: 12px 6px; box-shadow: 0 3px 0 var(--line); }
.badge-card__ico { font-size: 28px; }
.badge-card__label { font-family: var(--font-display); font-weight: 600; font-size: 11px; color: var(--ink); margin-top: 4px; }
.badge-card--locked { opacity: .5; }
.badge-card--locked .badge-card__label { color: var(--muted); }

/* result reward lines */
.gem-line { font-family: var(--font-display); font-weight: 600; color: #1899d6; margin: 4px 0; }
.ach-line { font-family: var(--font-display); font-weight: 600; color: var(--gold-d); margin: 4px 0 12px; }
```

- [ ] **Step 6: Build + full suite**

Run: `npx vite build` (success), `npx vitest run`
Expected: 72 tests passing (54 prior + 1 progress + 7 economy + 6 quests + 5 achievements = 73; confirm exact count and that all pass).

- [ ] **Step 7: Commit**

```bash
git add src/components/Quests.jsx src/components/Shop.jsx src/components/Profile.jsx src/components/Result.jsx src/styles.css
git commit -m "feat: quests/shop/achievements screens + result rewards"
```

---

## Task 7: Live verification + push

- [ ] **Step 1:** `npm run dev`. With a fresh onboarded profile: complete a lesson → result shows `💎 +N 젬 획득` and (on the first lesson) `🏆 새 업적`; header shows a 💎 gem chip that increased. Open 퀘스트 → the lessons/xp quests advanced; complete a quest and tap 받기 → gems increase, button shows 받음 ✓. Open 상점 → buttons disabled when unaffordable; earn enough gems (or verify disabled states); buying a streak freeze increases the count. Open 프로필 → the 첫 걸음 badge is unlocked, others locked. Console clean.
- [ ] **Step 2:** Stop dev, `npx vite build` (success).
- [ ] **Step 3:** `git push origin main`; confirm the Pages deploy concludes `success` and the live URL shows gems/quests/shop.

---

## Self-Review Notes
- **Spec coverage (§6):** gems earn → economy `gemsForLesson` + App `handleFinish`; shop → economy `buyHeartRefill`/`buyStreakFreeze` + Shop screen; daily quests → quests engine + Quests screen + midnight reset via `ensureQuests`; achievements → achievements engine + Profile badges. Leagues/leaderboards intentionally excluded.
- **Purity + tests:** all rules unit-tested; App only wires. Values match spec §8 defaults.
- **Migration:** new progress fields additive; `ensureQuests` guards empty/stale/`null` quests (covers onboarding + first load).
- **Name clash:** engine `claimQuest` imported as `claimQuestReward`; App's local `claimQuest` handler calls it.
- **Count note:** final expected total is 73 (54+1+7+6+5). Report the actual number.
```
