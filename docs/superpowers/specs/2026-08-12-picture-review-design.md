# 그림 문제 + 복습 모드 설계

날짜: 2026-08-12
대상: Lingo Duck (`orca/workspaces/lingoduck`, main)

두 신규 기능을 추가한다. 기존 아키텍처 원칙(순수 로직/React 분리·외부 에셋 0·데이터 추가만으로 확장·TDD)을 유지한다.

## 1. 그림 문제 — `picture` 익서사이즈 타입

기존 4타입(mcq/match/wordbank/listen)에 5번째를 추가한다. 구조는 mcq와 동일하되 **선택지가 이모지**다. 외부 이미지 에셋을 쓰지 않아 오프라인 PWA 원칙을 지킨다.

### 스키마
```json
{
  "type": "picture",
  "prompt": "사과는 어느 것?",
  "word": "apple",
  "choices": ["🍎", "🐱", "🏠", "🔴"],
  "answer": "🍎",
  "audioText": "apple"
}
```
- 불변식: `choices.length === 4`, `answer ∈ choices`, choices는 이모지 문자열.
- `word`/`audioText`는 선택 표시 및 TTS용.

### 컴포넌트 `src/components/exercises/Picture.jsx`
- 상단: `word` + `🔊 소리 듣기`(audioText 있을 때).
- 이모지 4개를 2×2 큰 카드 그리드로 렌더. 선택 시 `selected` 하이라이트.
- 하단 확인 버튼 → `onAnswer(checkAnswer(exercise, picked))`.
- `Lesson.jsx`의 REGISTRY에 `picture: Picture` 등록.

### 엔진
- `scoring.checkAnswer`: `case 'picture': return response === exercise.answer` (mcq와 동일 처리).
- `answerText.correctAnswerText`: `case 'picture': return \`${exercise.answer} ${exercise.word ?? ''}\`.trim()`.

### 콘텐츠
이모지 매핑이 자연스러운 **초급 어휘 레슨**(유치원~초1의 인사/색/동물/숫자/음식 등)에 레슨당 1~2문제 삽입한다. 데이터 추가만으로 즉시 노출된다(코드 변경 불요). 상급 레슨(추상 개념)에는 넣지 않는다.

## 2. 복습 모드 — 오답 우선 + 완료 콘텐츠

### 저장소 확장
`progress` v2 스키마에 `reviewQueue: []` 추가. `defaultProgress()`에 포함하고, `loadProgress`의 `{...defaultProgress(), ...parsed}` 병합으로 기존 사용자는 자동 마이그레이션된다.

`reviewQueue` 항목: `{ key: "<lessonId>#<exIndex>", lessonId, ex }` (ex는 전체 스냅샷 — 커리큘럼이 바뀌어도 복습이 자기완결). `key`로 중복 제거.

### 오답 기록
`Lesson.jsx`의 `onWrong` 콜백이 현재 익서사이즈 인덱스를 전달하도록 확장한다: `onWrong?.(session.queue[0].id)`. `session.queue[].id`는 원본 인덱스이므로 그대로 key에 쓴다. 정상 레슨 흐름(인자 무시)에는 영향이 없다.

App은 `handleWrong(exId)`에서 `activeLessonId != null && !reviewMode`일 때 `recordMistake`로 큐에 추가한다.

### 복습 엔진 `src/engine/review.js` (순수 함수)
- `recordMistake(reviewQueue, item)` → key 미존재 시 추가한 새 배열, 존재 시 원본 반환.
- `buildReviewSession({ reviewQueue, completedLessons }, lessonsById, { limit = 12, rng = Math.random })` → 익서사이즈 배열.
  - 오답 큐의 `ex`를 우선 배치(각 항목에 `_reviewKey` 부여).
  - 부족분은 `completedLessons`의 레슨 익서사이즈에서 랜덤(rng) 채움(`_reviewKey: null`), 이미 포함된 key 제외.
  - 최대 `limit`개. rng 주입으로 테스트 결정적.
- `clearSolved(reviewQueue, solvedKeys)` → solvedKeys를 제외한 새 배열.

### 복습 실행
동일 `Lesson` 컴포넌트를 합성 레슨(`{ id:'review', title:'복습', exercises }`)으로 재사용한다.
- App에 `reviewMode` 상태와 `screen === 'lesson'` 공유. 진입: `startReview()` → `buildReviewSession` 결과가 비면 무시, 아니면 lesson 화면.
- **첫 시도 정답 추적**: `Lesson`에 옵션 콜백 `onExerciseResult(exId, isCorrect)` 추가(handleAnswer에서 호출, 정상 레슨은 미전달로 no-op). App은 복습 중 각 exId의 오답 여부를 기록하고, 오답 없이 맞춘 `_reviewKey`만 solved로 수집.
- 완료 시(`handleReviewFinish`): `clearSolved`로 큐 정리, **XP 지급(`xpForLesson` 재사용), 하트 차감 없음**(복습은 연습이므로 `onWrong`이 하트를 깎지 않도록 review 분기), `completedLessons`·젬·퀘스트 변화 없음. 결과 화면은 기존 `Result` 재사용(젬 0).

### 진입점
학습 경로(`Path.jsx`) 상단에 `🔄 복습하기` 버튼. 배지로 오답 수(`reviewQueue.length`) 표시. `reviewQueue`가 비고 `completedLessons`도 비면 비활성.

## 3. 테스트
- `tests/review.test.js` 신규: recordMistake(dedup)·buildReviewSession(오답 우선/filler/limit/빈 상태)·clearSolved. rng 스텁으로 결정적.
- `tests/scoring.test.js`·`tests/answerText.test.js`: picture 케이스 추가.
- `tests/exercises.test.jsx`: Picture 정답/오답 렌더 케이스.
- 기존 73 pass 유지, 회귀 없음.

## 비목표 (YAGNI)
- 간격 반복(SRS) 스케줄링 — 이번 범위 아님(오답 우선으로 충분).
- 그림 문제의 SVG 아이콘셋 — 이모지로 충분.
- 복습 리그/리더보드 — 백엔드 필요, 제외.
