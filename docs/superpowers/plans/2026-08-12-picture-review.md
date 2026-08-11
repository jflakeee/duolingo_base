# 그림 문제 + 복습 모드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이모지 기반 `picture` 익서사이즈 타입과 오답-우선 복습 모드를 추가한다.

**Architecture:** 순수 로직(scoring·answerText·review 엔진)은 React와 분리해 Vitest 단위테스트. picture는 mcq와 동일한 채점 구조에 이모지 렌더만 다르고, 복습은 오답 스냅샷 큐(`progress.reviewQueue`)를 만들어 동일 `Lesson` 컴포넌트로 합성 레슨을 실행한다. 외부 에셋 0.

**Tech Stack:** React18, Vite5, Vitest, localStorage.

---

### Task 1: progress 스토어에 reviewQueue 필드 추가

**Files:**
- Modify: `src/store/progress.js:5-22`
- Test: `tests/progress.test.js`

- [ ] **Step 1: 실패 테스트 추가** — `tests/progress.test.js`에 추가

```js
import { defaultProgress, loadProgress } from '../src/store/progress.js'

test('defaultProgress has empty reviewQueue', () => {
  expect(defaultProgress().reviewQueue).toEqual([])
})

test('loadProgress migrates old data without reviewQueue', () => {
  localStorage.setItem('lingoduck.progress.v1', JSON.stringify({ xp: 40 }))
  expect(loadProgress().reviewQueue).toEqual([])
  expect(loadProgress().xp).toBe(40)
})
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/progress.test.js` → FAIL (reviewQueue undefined)

- [ ] **Step 3: 구현** — `defaultProgress()` 반환 객체에 `perfectCount: 0,` 다음 줄에 추가:

```js
    reviewQueue: [],
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run tests/progress.test.js` → PASS

- [ ] **Step 5: 커밋** — `git add -A && git commit -m "feat(review): progress.reviewQueue 필드 + 자동 마이그레이션"`

---

### Task 2: scoring·answerText에 picture 타입 지원

**Files:**
- Modify: `src/engine/scoring.js:10-22`
- Modify: `src/engine/answerText.js:2-14`
- Test: `tests/scoring.test.js`, `tests/answerText.test.js`

- [ ] **Step 1: 실패 테스트** — `tests/scoring.test.js`에 추가

```js
test('picture: correct when response equals answer emoji', () => {
  const ex = { type: 'picture', word: 'apple', choices: ['🍎','🐱','🏠','🔴'], answer: '🍎' }
  expect(checkAnswer(ex, '🍎')).toBe(true)
  expect(checkAnswer(ex, '🐱')).toBe(false)
})
```

`tests/answerText.test.js`에 추가:

```js
test('picture answer text is emoji + word', () => {
  expect(correctAnswerText({ type: 'picture', answer: '🍎', word: 'apple' })).toBe('🍎 apple')
})
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/scoring.test.js tests/answerText.test.js` → FAIL

- [ ] **Step 3: 구현** — `scoring.js`의 `switch` 안 `case 'mcq':` 위에 추가:

```js
    case 'picture':
      return response === exercise.answer
```

`answerText.js`의 `switch` 안 `case 'mcq':` 위에 추가:

```js
    case 'picture':
      return `${exercise.answer} ${exercise.word ?? ''}`.trim()
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run tests/scoring.test.js tests/answerText.test.js` → PASS

- [ ] **Step 5: 커밋** — `git add -A && git commit -m "feat(picture): scoring·answerText picture 타입 지원"`

---

### Task 3: Picture.jsx 컴포넌트 + Lesson 등록

**Files:**
- Create: `src/components/exercises/Picture.jsx`
- Modify: `src/components/Lesson.jsx:7-12`
- Test: `tests/exercises.test.jsx`

- [ ] **Step 1: 실패 테스트** — `tests/exercises.test.jsx`에 추가

```jsx
import Picture from '../src/components/exercises/Picture.jsx'

describe('Picture', () => {
  const ex = { type: 'picture', prompt: '사과는?', word: 'apple', choices: ['🍎','🐱','🏠','🔴'], answer: '🍎', audioText: 'apple' }
  it('reports correct when right emoji picked', () => {
    const onAnswer = vi.fn()
    render(<Picture exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('🍎'))
    fireEvent.click(screen.getByText('확인'))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
  it('reports wrong when wrong emoji picked', () => {
    const onAnswer = vi.fn()
    render(<Picture exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('�forbidden'.replace('forbidden','🐱').slice(0,2)))
    fireEvent.click(screen.getByText('확인'))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
})
```

Note: 두 번째 테스트의 선택은 간단히 `screen.getByText('🐱')`로 대체해도 됨. 실제 작성 시:

```jsx
  it('reports wrong when wrong emoji picked', () => {
    const onAnswer = vi.fn()
    render(<Picture exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('🐱'))
    fireEvent.click(screen.getByText('확인'))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/exercises.test.jsx` → FAIL (Picture 없음)

- [ ] **Step 3: 구현** — `src/components/exercises/Picture.jsx` 생성:

```jsx
import { useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak } from '../../audio/tts.js'

export default function Picture({ exercise, onAnswer }) {
  const [picked, setPicked] = useState(null)
  return (
    <div>
      <h2>{exercise.prompt}</h2>
      {exercise.word && (
        <button className="audio-btn" onClick={() => speak(exercise.audioText ?? exercise.word)}>
          🔊 {exercise.word}
        </button>
      )}
      <div className="pic-grid">
        {exercise.choices.map((c) => (
          <button
            key={c}
            className={`pic-card ${picked === c ? 'selected' : ''}`}
            onClick={() => setPicked(c)}
            aria-label={c}
          >
            <span className="pic-emoji">{c}</span>
          </button>
        ))}
      </div>
      <div className="action-bar">
        <button className="btn" disabled={picked === null}
          onClick={() => onAnswer(checkAnswer(exercise, picked))}>확인</button>
      </div>
    </div>
  )
}
```

`Lesson.jsx`: import 추가(줄 11 다음)와 REGISTRY 확장:

```jsx
import Picture from './exercises/Picture.jsx'
```
```jsx
const REGISTRY = { mcq: Mcq, wordbank: WordBank, listen: Listen, match: Match, picture: Picture }
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run tests/exercises.test.jsx` → PASS

- [ ] **Step 5: 커밋** — `git add -A && git commit -m "feat(picture): 이모지 2×2 그리드 Picture 익서사이즈"`

---

### Task 4: review 엔진 (recordMistake·buildReviewSession·clearSolved)

**Files:**
- Create: `src/engine/review.js`
- Test: `tests/review.test.js`

- [ ] **Step 1: 실패 테스트** — `tests/review.test.js` 생성:

```js
import { describe, it, test, expect } from 'vitest'
import { recordMistake, buildReviewSession, clearSolved } from '../src/engine/review.js'

const item = (key, ex) => ({ key, lessonId: key.split('#')[0], ex: ex ?? { type: 'mcq', prompt: key, choices: ['a','b'], answer: 'a' } })

describe('recordMistake', () => {
  it('adds new item', () => {
    expect(recordMistake([], item('L1#0'))).toHaveLength(1)
  })
  it('dedups by key', () => {
    const q = [item('L1#0')]
    expect(recordMistake(q, item('L1#0'))).toBe(q)
  })
})

describe('buildReviewSession', () => {
  const lessonsById = {
    L1: { exercises: [{ type: 'mcq', prompt: 'a', choices: ['a'], answer: 'a' }, { type: 'mcq', prompt: 'b', choices: ['b'], answer: 'b' }] },
  }
  it('puts mistakes first with _reviewKey', () => {
    const state = { reviewQueue: [item('L1#0')], completedLessons: [] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0 })
    expect(s[0]._reviewKey).toBe('L1#0')
  })
  it('fills from completed lessons up to limit', () => {
    const state = { reviewQueue: [], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 5, rng: () => 0 })
    expect(s.length).toBe(2)
    expect(s.every((e) => e._reviewKey === null)).toBe(true)
  })
  it('respects limit (mistakes take priority)', () => {
    const state = { reviewQueue: [item('L1#0'), item('L1#1')], completedLessons: ['L1'] }
    const s = buildReviewSession(state, lessonsById, { limit: 1, rng: () => 0 })
    expect(s.length).toBe(1)
    expect(s[0]._reviewKey).toBe('L1#0')
  })
  it('returns empty when nothing to review', () => {
    expect(buildReviewSession({ reviewQueue: [], completedLessons: [] }, lessonsById, {})).toEqual([])
  })
})

describe('clearSolved', () => {
  it('removes solved keys', () => {
    const q = [item('L1#0'), item('L1#1')]
    expect(clearSolved(q, ['L1#0']).map((x) => x.key)).toEqual(['L1#1'])
  })
})
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/review.test.js` → FAIL (module 없음)

- [ ] **Step 3: 구현** — `src/engine/review.js` 생성:

```js
// Review-mode engine. Pure functions; UI wires them in App.

// reviewQueue item: { key: "<lessonId>#<exIndex>", lessonId, ex }
export function recordMistake(reviewQueue, item) {
  if (reviewQueue.some((q) => q.key === item.key)) return reviewQueue
  return [...reviewQueue, item]
}

export function clearSolved(reviewQueue, solvedKeys) {
  const solved = new Set(solvedKeys)
  return reviewQueue.filter((q) => !solved.has(q.key))
}

// Deterministic-when-rng-injected shuffle (Fisher–Yates).
function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Returns exercises tagged with _reviewKey (string for mistakes, null for filler).
export function buildReviewSession({ reviewQueue, completedLessons }, lessonsById, { limit = 12, rng = Math.random } = {}) {
  const mistakes = reviewQueue.slice(0, limit).map((q) => ({ ...q.ex, _reviewKey: q.key }))
  if (mistakes.length >= limit) return mistakes

  const usedKeys = new Set(reviewQueue.map((q) => q.key))
  const pool = []
  for (const lessonId of completedLessons) {
    const lesson = lessonsById[lessonId]
    if (!lesson) continue
    lesson.exercises.forEach((ex, i) => {
      const key = `${lessonId}#${i}`
      if (!usedKeys.has(key)) pool.push({ ...ex, _reviewKey: null })
    })
  }
  const filler = shuffle(pool, rng).slice(0, limit - mistakes.length)
  return [...mistakes, ...filler]
}
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run tests/review.test.js` → PASS

- [ ] **Step 5: 커밋** — `git add -A && git commit -m "feat(review): 복습 세션 엔진(오답 우선·filler·clearSolved)"`

---

### Task 5: Lesson.jsx 콜백 확장 (onWrong exId, onExerciseResult)

**Files:**
- Modify: `src/components/Lesson.jsx:14-28`

- [ ] **Step 1: 구현** — `Lesson` 시그니처와 `handleAnswer` 수정. 현 `export default function Lesson({ lesson, onWrong, onFinish, onQuit })`를:

```jsx
export default function Lesson({ lesson, onWrong, onExerciseResult, onFinish, onQuit }) {
```

`handleAnswer` 안에서 `const ex = currentExercise(session)` 이후 값이 필요하므로, `handleAnswer` 첫 줄에서 현재 exId를 잡는다. 기존:

```jsx
  function handleAnswer(isCorrect) {
    const nextCombo = isCorrect ? combo + 1 : 0
    if (isCorrect) { playCorrect(); buzzCorrect() } else { playWrong(); buzzWrong(); onWrong?.() }
    setCombo(nextCombo)
    setSheet({ correct: isCorrect, answerText: correctAnswerText(ex), combo: nextCombo })
  }
```

를 다음으로 교체:

```jsx
  function handleAnswer(isCorrect) {
    const exId = session.queue[0].id
    const nextCombo = isCorrect ? combo + 1 : 0
    if (isCorrect) { playCorrect(); buzzCorrect() } else { playWrong(); buzzWrong(); onWrong?.(exId) }
    onExerciseResult?.(exId, isCorrect)
    setCombo(nextCombo)
    setSheet({ correct: isCorrect, answerText: correctAnswerText(ex), combo: nextCombo })
  }
```

- [ ] **Step 2: 회귀 확인** — Run: `npx vitest run tests/app.test.jsx tests/exercises.test.jsx` → PASS (정상 레슨은 인자 무시)

- [ ] **Step 3: 커밋** — `git add -A && git commit -m "feat(review): Lesson onWrong(exId)·onExerciseResult 콜백"`

---

### Task 6: App.jsx 복습 모드 배선

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 구현 — import 추가** (줄 18 근처, achievements import 다음):

```jsx
import { getLessonById, getLevels, getLessonSequence } from './data/loadCurriculum.js'
import { recordMistake, buildReviewSession, clearSolved } from './engine/review.js'
```
(기존 `getLessonById, getLevels` import 줄을 위 첫 줄로 교체.)

- [ ] **Step 2: 구현 — lessonsById 조회맵 + review 상태.** `export default function App()` 본문 상단, `const [summary, setSummary] = useState(null)` 다음에 추가:

```jsx
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewExercises, setReviewExercises] = useState([])
  const reviewWrongIds = useState(() => new Set())[0]
```

`todayStr` 아래(App 밖) 또는 App 안 상단에 조회맵 헬퍼:

```jsx
  const lessonsById = {}
  for (const { lesson } of getLessonSequence()) lessonsById[lesson.id] = lesson
```

- [ ] **Step 3: 구현 — handleWrong(exId) 오답 기록.** 기존 `handleWrong`:

```jsx
  function handleWrong() {
    const wasFull = progress.hearts >= 5
    const next = { ...progress, hearts: loseHeart(progress.hearts), heartsUpdatedAt: wasFull ? Date.now() : progress.heartsUpdatedAt }
    persist(next)
    if (next.hearts <= 0) setScreen('fail')
  }
```

를 교체:

```jsx
  function handleWrong(exId) {
    if (reviewMode) return // 복습은 하트 차감·기록 없음
    const wasFull = progress.hearts >= 5
    const key = `${activeLessonId}#${exId}`
    const ex = getLessonById(activeLessonId)?.exercises?.[exId]
    const withMistake = ex
      ? { ...progress, reviewQueue: recordMistake(progress.reviewQueue ?? [], { key, lessonId: activeLessonId, ex }) }
      : progress
    const next = { ...withMistake, hearts: loseHeart(progress.hearts), heartsUpdatedAt: wasFull ? Date.now() : progress.heartsUpdatedAt }
    persist(next)
    if (next.hearts <= 0) setScreen('fail')
  }
```

- [ ] **Step 4: 구현 — startReview / handleExerciseResult / handleReviewFinish.** `handleFinish` 다음에 추가:

```jsx
  function startReview() {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    const exercises = buildReviewSession(
      { reviewQueue: progress.reviewQueue ?? [], completedLessons: progress.completedLessons },
      lessonsById,
    )
    if (exercises.length === 0) return
    reviewWrongIds.clear()
    setReviewExercises(exercises)
    setReviewMode(true)
    setActiveLessonId(null)
    setScreen('lesson')
  }
  function handleExerciseResult(exId, isCorrect) {
    if (reviewMode && !isCorrect) reviewWrongIds.add(exId)
  }
  function handleReviewFinish(s) {
    const solvedKeys = reviewExercises
      .map((ex, i) => ({ ex, i }))
      .filter(({ ex, i }) => ex._reviewKey && !reviewWrongIds.has(i))
      .map(({ ex }) => ex._reviewKey)
    const today = todayStr()
    const next = {
      ...progress,
      xp: progress.xp + s.xpGained,
      dailyXp: addDailyXp(progress.dailyXp, s.xpGained, today),
      reviewQueue: clearSolved(progress.reviewQueue ?? [], solvedKeys),
    }
    persist(next)
    setReviewMode(false)
    setSummary({ ...s, gemsGained: 0, newAchievements: [] })
    setScreen('result')
  }
```

- [ ] **Step 5: 구현 — lesson/result 렌더 분기.** 기존 lesson 렌더:

```jsx
          {screen === 'lesson' && (
            <Lesson lesson={getLessonById(activeLessonId)} onWrong={handleWrong} onFinish={handleFinish} onQuit={() => setScreen('path')} />
          )}
```

를 교체:

```jsx
          {screen === 'lesson' && (
            <Lesson
              lesson={reviewMode
                ? { id: 'review', title: '복습', exercises: reviewExercises }
                : getLessonById(activeLessonId)}
              onWrong={handleWrong}
              onExerciseResult={handleExerciseResult}
              onFinish={reviewMode ? handleReviewFinish : handleFinish}
              onQuit={() => { setReviewMode(false); setScreen('path') }}
            />
          )}
```

Path 렌더에 `onReview` 전달:

```jsx
          {screen === 'path' && <Path progress={progress} onStart={startLesson} onReview={startReview} />}
```

- [ ] **Step 6: 회귀 확인** — Run: `npx vitest run` → 전체 PASS (기존 + 신규)

- [ ] **Step 7: 커밋** — `git add -A && git commit -m "feat(review): App 복습 모드 배선(오답 기록·합성 레슨·정리)"`

---

### Task 7: Path.jsx 복습하기 버튼

**Files:**
- Modify: `src/components/Path.jsx:35, 45-55`

- [ ] **Step 1: 구현** — 시그니처 `export default function Path({ progress, onStart })`를 `({ progress, onStart, onReview })`로. `path-hero` div 다음, 첫 `getLevels().map` 전에 삽입:

```jsx
      {(() => {
        const reviewCount = (progress.reviewQueue ?? []).length
        const canReview = reviewCount > 0 || progress.completedLessons.length > 0
        return (
          <button className="review-btn" disabled={!canReview} onClick={onReview}>
            🔄 복습하기{reviewCount > 0 && <span className="review-badge">{reviewCount}</span>}
          </button>
        )
      })()}
```

- [ ] **Step 2: 확인** — Run: `npx vitest run tests/app.test.jsx` → PASS

- [ ] **Step 3: 커밋** — `git add -A && git commit -m "feat(review): 학습 경로 복습하기 버튼(오답 배지)"`

---

### Task 8: 스타일 (picture 그리드 + 복습 버튼)

**Files:**
- Modify: `src/styles.css` (끝에 추가)

- [ ] **Step 1: 구현** — `src/styles.css` 끝에 추가:

```css
/* Picture exercise */
.pic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
.pic-card {
  aspect-ratio: 1 / 1; border: 2px solid var(--line, #e5e5e5); border-radius: 16px;
  background: var(--card, #fff); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform .08s, border-color .12s, background .12s;
}
.pic-card:active { transform: translateY(2px); }
.pic-card.selected { border-color: #58cc02; background: rgba(88,204,2,.10); }
.pic-emoji { font-size: 64px; line-height: 1; }

/* Review button */
.review-btn {
  display: inline-flex; align-items: center; gap: 8px; margin: 4px 0 14px;
  padding: 12px 18px; border-radius: 14px; border: 2px solid #1cb0f6;
  color: #1cb0f6; background: var(--card, #fff); font-weight: 800; cursor: pointer;
}
.review-btn:disabled { opacity: .45; cursor: default; }
.review-badge {
  background: #ff4b4b; color: #fff; border-radius: 999px;
  padding: 1px 8px; font-size: 13px; font-weight: 800;
}
```

- [ ] **Step 2: 빌드 확인** — Run: `npx vite build` → 성공

- [ ] **Step 3: 커밋** — `git add -A && git commit -m "style(review): picture 그리드·복습 버튼 스타일"`

---

### Task 9: 콘텐츠 — 초급 레슨에 picture 문제 삽입

**Files:**
- Modify: `src/data/curriculum.json` (스크립트로 삽입)
- Create(임시): `scripts/add_pictures.py`

- [ ] **Step 1: 삽입 스크립트 작성** — `scripts/add_pictures.py`:

```python
import json, io
P = 'src/data/curriculum.json'
d = json.load(io.open(P, encoding='utf-8'))

# lessonId -> list of (prompt, word, answerEmoji, distractor emojis[3], audioText)
PIC = {
  'kinder-u1-l1': [('사과는 어느 것?','apple','🍎',['🐱','🏠','🔴'],'apple'),
                   ('고양이는 어느 것?','cat','🐱',['🍎','⭐','🚗'],'cat')],
  'kinder-u2-l1': [('빨강은 어느 것?','red','🔴',['🔵','🟢','🟡'],'red'),
                   ('파랑은 어느 것?','blue','🔵',['🔴','🟢','🟡'],'blue')],
  'kinder-u3-l1': [('개는 어느 것?','dog','🐶',['🐱','🐭','🐰'],'dog'),
                   ('물고기는 어느 것?','fish','🐟',['🐶','🐤','🐸'],'fish')],
  'kinder-u4-l1': [('별 세 개는?','three','⭐⭐⭐',['⭐','⭐⭐','⭐⭐⭐⭐'],'three')],
}

count = 0
for lv in d['levels']:
  for un in lv['units']:
    for ls in un['lessons']:
      pics = PIC.get(ls['id'])
      if not pics: continue
      for (prompt, word, ans, dis, audio) in pics:
        choices = [ans] + dis
        ex = {'type':'picture','prompt':prompt,'word':word,'choices':choices,'answer':ans,'audioText':audio}
        ls['exercises'].insert(min(1, len(ls['exercises'])), ex)
        count += 1

json.dump(d, io.open(P,'w',encoding='utf-8'), ensure_ascii=False, indent=2)
print('inserted', count, 'picture exercises')
```

Note: 대상 lessonId가 실제 존재하는지 먼저 확인:
`python -c "import json,io;d=json.load(io.open('src/data/curriculum.json',encoding='utf-8'));ids=[l['id'] for lv in d['levels'] for u in lv['units'] for l in u['lessons']];print([i for i in ['kinder-u1-l1','kinder-u2-l1','kinder-u3-l1','kinder-u4-l1'] if i in ids])"`
없는 id는 실제 초급 레슨 id로 교체(유치원 어휘 레슨 위주). 이모지 매핑이 자연스러운 것만.

- [ ] **Step 2: 실행 + 검증** — Run: `python scripts/add_pictures.py` 후 JSON 유효성:
`python -c "import json,io;json.load(io.open('src/data/curriculum.json',encoding='utf-8'));print('valid')"`
불변식 검사: 각 picture는 `answer in choices` and `len(choices)==4`.

- [ ] **Step 3: 스크립트 제거** — `rm scripts/add_pictures.py` (일회성). 전체 테스트: `npx vitest run` → PASS

- [ ] **Step 4: 커밋** — `git add -A && git commit -m "content(picture): 유치원 어휘 레슨에 이모지 그림 문제 삽입"`

---

### Task 10: 라이브 검증 + 배포

- [ ] **Step 1: 전체 테스트** — Run: `npx vitest run` → 전부 PASS (73 + 신규)

- [ ] **Step 2: 프로덕션 빌드** — Run: `npx vite build` → 성공, PWA 생성

- [ ] **Step 3: Playwright 스모크** — dev 서버 띄워 온보딩→picture 레슨 진입(이모지 그리드 렌더)→오답 발생→경로 복습하기 배지 증가→복습 세션 실행→완료 화면. 스크린샷으로 육안 확인.

- [ ] **Step 4: 푸시 + 배포 확인** — `git push origin main` 후 `gh run list --limit 1`로 Actions green 확인, 라이브 URL 서빙 확인.

- [ ] **Step 5: 메모리 갱신** — `project_lingoduck.md`에 picture 5번째 타입·복습 모드(reviewQueue) 추가 반영.
