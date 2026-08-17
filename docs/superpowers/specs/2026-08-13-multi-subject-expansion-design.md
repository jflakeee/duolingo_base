# 멀티 과목 확장 설계 (수학·국어·논술)

날짜: 2026-08-13
상태: **구현 완료** (2026-08-17). 수학·국어·논술 3과목 모두 병합. 논술은 **객관식 하위역량만**(reading·order 유형). 로드맵 1~3단계 전부 완료.
대상: Lingo Duck (main)

영어 전용 학습앱을 **과목(subject) 추상화**로 일반화해 수학·국어·논술을 담을 수 있게 한다. 백엔드 0·오프라인 PWA 제약은 유지한다.

---

## 1. 목표 / 비목표
**목표**
- 과목 레이어를 도입해 영어 외 과목을 데이터·생성기 추가만으로 확장.
- 과목별 진도, 공용 메타게임(하트·젬·스트릭·XP), 과목별 절차적 생성.

**비목표 (백엔드/LLM 없음에서 불가)**
- **논술 에세이 자동 채점**(개방형 서술) — 객관식 하위역량으로만.
- 서버 계정·AI 채점·음성 인식(말하기).

## 2. 현재 상태 (단일 과목)
- `src/data/curriculum.json` 하나 = 영어 커리큘럼. `loadCurriculum.js`가 `getLevels/getLessonSequence/getLessonById`로 노출.
- 문제 유형 7종: mcq·wordbank·listen·match·picture·typein·dictation.
- 생성기 `generators.js`(+`practiceData.js`) = 영어 특화(number words·영어 어휘/동사/유의어/업무).
- TTS = en-US 고정(`audio/tts.js`).
- 진도 = `progress.completedLessons`·`reviewQueue`(단일 과목 전제).

## 3. 과목별 타당성 (자동채점 × 생성 적합성)
| 과목 | 자동채점 | 생성 적합성 | 필요 | 판정 |
|---|---|---|---|---|
| 수학 | ✅ 완전 | ⭐ 최상 | 숫자 typein/mcq 재사용, TTS 불필요 | **1순위** |
| 국어 | ✅ 대체로 | ○ 양호 | ko-KR TTS, 한국어 데이터, 독해 지문 | 2순위 |
| 논술 | ❌ 개방형 | ✗ 불가 | 객관식 하위역량으로 분해 | 3순위(제한) |

## 4. 아키텍처 — 과목 추상화

### 4.1 데이터
- `src/data/subjects/english.json` (기존 curriculum.json 이동), `math.json`, `korean.json`, `essay.json`. **동일 스키마**(levels→units→lessons→exercises).
- `src/data/subjects.js`: 레지스트리
  ```
  { id, name, icon, ttsLang, curriculum } // ttsLang: 'en-US' | 'ko-KR' | null(수학)
  ```
- `loadCurriculum.js` → **subject 인자화**: `getLevels(subject)`, `getLessonSequence(subject)`, `getLessonById(subject, id)`. 기본값 = activeSubject.

### 4.2 진도 모델 (progress v3)
- **공용**(과목 무관): memberId·google·role·children·messages·hearts·gems·**streak**·**xp**·dailyXp·dailyGoal·quests·achievements·settings·onboarded.
- **과목별**: `progress.subjects[subjectId] = { completedLessons, reviewQueue }`.
- `progress.activeSubject`(기본 'english').
- **마이그레이션**: `loadProgress`에서 v2→v3 — 최상위 `completedLessons/reviewQueue`를 `subjects.english`로 이동, `activeSubject='english'`. (기존 사용자 무손실. 공용 XP·스트릭 유지.)
- 근거: 메타게임(하트·젬·스트릭·XP)은 **공용**이 동기부여에 유리, 진도(완료 레슨·복습 큐)는 **과목별**이 맞음.

### 4.3 생성기 레지스트리
- `src/engine/generators/index.js`: `generatorsFor(subject, levelId)` → 해당 과목·레벨 생성기 배열([]이면 풀 샘플링).
- 기존 영어 → `generators/english.js`(현 generators.js 이동). 신규 `math.js`·`korean.js`·`essay.js`.
- `practice.js` `buildDailyPractice`는 그대로(과목 무관). App `startPractice`가 `generatorsFor(activeSubject, levelId)` 호출.

### 4.4 TTS 로케일
- `speak(text, lang)` 이미 lang 인자 지원. 과목 메타 `ttsLang`을 문제/과목 기준으로 전달. 수학=미사용.

### 4.5 UI
- **과목 선택기**: 학습 탭 상단 칩(영어/수학/국어/논술) 또는 별도 과목 홈. `activeSubject` 전환 → Path·오늘의연습이 해당 과목으로.
- 헤더·하단탭·프로필·복습·연습은 과목 무관(공용). 프로필 통계에 과목별 완료율 표시(선택).

## 5. 과목별 설계

### 5.1 수학 (1순위 · 생성기 지배)
- **문제 유형**: 대부분 `typein`(숫자 답, normalizeText가 문자열 비교 → "8"=="8" OK) + `mcq`(저학년 보기 선택). *선택: `math` 신유형(숫자 키패드)로 모바일 입력 개선.*
- **생성기**(난이도 밴드별 무한):
  - 유치원~초2: 덧셈·뺄셈(한 자리→두 자리), 수 세기, 크기 비교.
  - 초3~6: 곱셈·나눗셈, 분수·소수, 백분율, 도형 둘레/넓이(치수 주어짐).
  - 중1~3: 일차방정식(`x+3=7, x=?`), 비례, 지수·제곱근, 간단 함수값.
  - 고~: 이차방정식·수열·확률(생성 가능한 범위). 서술형 증명은 비목표.
  - 문장제(템플릿): "사과 N개 중 M개…" 산술 매핑.
- **채점**: 숫자 정확 비교(공백·부호 정규화). 분수는 표준형 or accept 다형.
- TTS 불필요. **가장 낮은 콘텐츠 비용·최고 ROI.**

### 5.2 국어 (2순위 · ko-KR)
- **문제 유형**: mcq·typein·`dictation`(ko-KR)·`reading`(신유형: 지문+문항).
- **생성기/데이터**:
  - 어휘: 유의어·반대말(한국어 쌍), 한자어 뜻(mcq), 속담·관용구.
  - **맞춤법**: 4개 표기 중 옳은 것 고르기(데이터: 자주 틀리는 맞춤법 쌍). 띄어쓰기.
  - **받아쓰기**: ko-KR TTS로 문장 듣고 쓰기(dictation 재사용).
  - **독해**: 지문 + 사실확인/추론 객관식(`reading` 유형, authored 지문 은행).
- ko-KR TTS 로케일 필요. 한국어 데이터 큐레이션 필요(생성기는 어휘·맞춤법에 강, 독해는 authored).

### 5.3 논술 (3순위 · **객관식 하위역량만**)
- **에세이 자동채점은 비목표**(백엔드/LLM 없음). 대신 논술 역량을 **객관적 하위과제**로 분해:
  - **주제문/논지 고르기**(mcq): 글에 맞는 주제문 선택.
  - **논거·문장 배열**(`order` 신유형): 개요/문단을 논리 순서로 배열.
  - **논리 오류 찾기**(mcq): 성급한 일반화·허수아비 등 식별.
  - **접속어/연결어 채우기**(mcq/typein): 그러나·따라서·예를 들어…
  - **근거-주장 연결**(match), **개요 순서**(order).
- 콘텐츠는 주로 **authored 아이템 은행**(생성 여지 적음). 완전 에세이는 향후 백엔드/AI 도입 시 별도.

## 6. 신규 문제 유형 (최소)
- `reading`: `{ type:'reading', passage, prompt, choices[], answer }` — 국어 독해·논술 공용(mcq+지문). 컴포넌트 간단.
- `order`: `{ type:'order', prompt, items[], answer:[정렬된 인덱스/문자열] }` — 배열형(논거·문장·개요). wordbank UI 변형 재사용 가능.
- (선택) `math`: 숫자 키패드 입력. 없으면 `typein`으로 충분.

## 7. 마이그레이션·호환
- `loadProgress` v2→v3: 최상위 completedLessons/reviewQueue → `subjects.english`. 나머지 공용 필드 유지. 기존 영어 사용자 무손실.
- 영어 커리큘럼·생성기·기존 테스트는 과목 레지스트리 뒤로 이동만(동작 동일).
- 계정 공유 코드(LDX1)는 완료레슨 비트마스크가 **과목별**이 되므로 과목 차원 추가 필요(코덱 버전 업 or 과목별 코드).

## 8. 단계적 로드맵 (권장)
1. **과목 추상화 + 수학**: 레지스트리·진도 v3·과목 선택기 + 수학 생성기. 가장 큰 검증·ROI.
2. **국어**: ko-KR TTS·어휘/맞춤법 생성기·받아쓰기·독해(reading 유형).
3. **논술(객관식 하위역량)**: order/reading 유형 + authored 아이템 은행.

## 9. 리스크·비용
- 과목 추상화 리팩터(로더·진도·UI·생성기 레지스트리): **중간**. 진도 마이그레이션·공유코드 과목화가 함정.
- 수학: 콘텐츠 비용 **낮음**(생성기), 가치 **최고**.
- 국어: 중간(TTS 로케일·한국어 데이터).
- 논술: 콘텐츠 비용 **높음**(authored), 자동채점 제한.

## 10. 미해결 질문
- XP·스트릭을 완전 공용 vs 과목별로 볼지(권장: 공용, 프로필에 과목별 완료율만).
- 과목 선택기 위치(학습 탭 상단 칩 vs 별도 과목 홈).
- 공유 코드(LDX1) 과목화 방식(버전업 vs 과목별 코드).
- 온보딩에서 과목 선택 추가 여부(기본 영어 유지 권장).
