# 오늘의 연습 — 같은 난이도 다른 문제 설계

날짜: 2026-08-13
대상: Lingo Duck (main)

레벨을 반복해도 매일 다른 문제로 연습할 수 있게 한다. 진입점은 학습 경로 상단 "오늘의 연습". 두 레버를 결합한다.

## 진단
- 콘텐츠 고정 87레슨/467문제, 레벨당 풀 ~20. 레슨 재실행=완전 동일 문제·순서.
- 기존 복습(오답 우선+완료레슨 필러)은 일자 개념 없음.

## Phase 1 — 날짜 시드 샘플링 (콘텐츠 0)
`engine/practice.js` (순수 함수):
- `dailySeed(dateStr, salt='')` → 정수 해시.
- `mulberry32(seed)` → 결정적 PRNG `() => [0,1)`.
- `shuffleSeeded(arr, rng)` → Fisher–Yates.
- `levelExercises(level)` → 레벨 내 모든 exercise 평탄화.
- `varyChoices(ex, rng)` → mcq/picture는 `choices` 순서 셔플(정답은 값 비교라 안전), 그 외 그대로.
- `buildDailyPractice(level, dateStr, { size=10, rng, generated=[] })` → `[...generated, ...pool.map(varyChoices)]`를 시드 셔플 후 size개. 각 항목 `_practice:true` 태그.

날짜 시드라 하루 동안은 동일, 매일 구성·순서 변경. 풀 한정으로 개별 문제는 재등장하나 구성은 매일 다름.

## Phase 2 — 절차적 생성기 (무한 신규, 초급 중심)
`engine/generators.js` (순수, rng 주입 결정적):
- `numberWord(n)` 0~20(+tens). 
- 숫자: `genNumberTypein`(숫자→영어 타이핑)·`genNumberMcq`(4지선다 number-word).
- 어휘 풀(색·동물·음식·가족·날씨·감정, 각 {word, ko, emoji}): `genVocabPicture`·`genVocabMcq`·`genVocabTypein`.
- `LEVEL_GENERATORS`: kinder→숫자1-10+색·동물·음식, grade1→숫자1-20+가족, grade2→날씨·감정. grade3+→생성기 없음(샘플링만).
- `generateForLevel(levelId, rng, count)` → 해당 레벨 생성기로 count개(없으면 []). 불변식: mcq/picture answer∈choices·4개·중복없음, typein answer 비어있지 않음.
- 통합: `buildDailyPractice`에 `generated = generateForLevel(levelId, rng, floor(size*0.6))` 주입(생성기 있는 레벨은 신규 다수, 없으면 샘플링).

## App 배선 (복습 모드 미러)
- state `practiceMode`·`practiceExercises`. `startPractice(levelId)`(하트 체크 없음·무차감): dailySeed(today+levelId)→rng→generated+buildDailyPractice→합성 레슨 lesson 화면.
- `handleWrong`: `if (reviewMode || practiceMode) return`(하트 무차감·기록 없음).
- `handlePracticeFinish(s)`: **XP만 지급**(dailyXp 반영), 하트·completedLessons·reviewQueue·젬 변화 없음. Result 재사용(gems 0).
- lesson/onFinish/onQuit에 practiceMode 분기 추가.

## Path UI
학습 경로 상단 "오늘의 연습": 레벨 `<select>`(전체 20레벨, 기본=현재 레벨) + "연습 시작" 버튼 → `onPractice(levelId)`.

## 테스트
- practice.js: dailySeed 결정성·mulberry32 범위·shuffleSeeded 결정성/불변·varyChoices(mcq 셔플·정답 유지)·buildDailyPractice(size·날짜별 상이·generated 우선).
- generators.js: numberWord·각 생성기 불변식·generateForLevel(레벨별 유무·count·결정성).
- 기존 167 pass 유지.

## 비목표
- 문법/문장형(wordbank/listen) 생성(난이도 높음)→샘플링 유지. 서버·LLM 생성.
