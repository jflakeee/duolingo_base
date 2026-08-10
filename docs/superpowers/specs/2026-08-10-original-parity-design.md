# Lingo Duck — 원본 수준 개선 로드맵 설계

> 작성일: 2026-08-10 · 상태: 확정(사용자 승인) · 후속: Phase 1부터 구현 계획

## 0. 목표와 경계

듀오링고가 주는 **품질·완성도 수준**을 우리 앱의 모든 요소에 재현한다.
단, **오리지널 브랜딩 유지** — 듀오링고의 마스코트/로고/폰트/일러스트/사운드 등
저작권·상표 자산은 일절 복제하지 않는다. UX 패턴(공개적으로 알려진 기능적 구조)만 참고해
자체 구현으로 동등 품질을 낸다.

- 스택 불변: React + Vite SPA, **무백엔드·무외부에셋·localStorage**, CSP 안전.
- **리그/리더보드는 범위 밖**(멀티유저·백엔드 필요).
- 학습자: 영어 전용·단일 사용자·범용 연령.

## 1. 데이터 모델 (progress v2)

기존 v1 필드 유지 + 아래 추가. `loadProgress`가 이미 `{...defaultProgress(), ...saved}`
병합이므로 **기존 저장분은 자동 승격**(누락 필드에 기본값 주입). `version`은 2로 올리되
마이그레이션 코드는 병합으로 충분.

```jsonc
{
  "version": 2,
  // v1 기존
  "xp": 0, "hearts": 5, "heartsUpdatedAt": 0,
  "streak": { "count": 0, "lastDay": null, "freezes": 1 },
  "completedLessons": [], "dailyXp": { "day": null, "amount": 0 },
  // v2 신규
  "gems": 0,
  "dailyGoal": 50,
  "onboarded": false,
  "quests": { "day": null, "items": [] },          // items: {id,type,target,progress,claimed}
  "achievements": {},                                // { achievementId: "YYYY-MM-DD" }
  "settings": { "theme": "auto" }                   // 'auto' | 'light' | 'dark'
}
```

## 2. Phase 개요 (각 Phase = 독립 배포 슬라이스)

| Phase | 범위 | 신규 시스템 | 우선순위 |
|---|---|---|---|
| **1** | 기존 화면 완성도(A) | 없음 | 1 (체감 최대) |
| **2** | 모션·사운드(B) | 없음 | 2 |
| **3** | 구조·온보딩(C) | 앱 셸·탭·온보딩·프로필 | 3 |
| **4** | 게임요소(D) | 젬·상점·퀘스트·업적 | 4 |

각 Phase는 spec 요약 → writing-plans → subagent 구현 → 라이브 검증 → 푸시(자동배포).
Phase 3·4는 Phase 1·2 완료 후 별도 계획으로 상세화(본 문서엔 스코프만 확정).

---

## 3. Phase 1 상세 — 기존 화면 완성도 (A)

신규 시스템 0. 아래 6개.

### 1-1. 굽잇길 커넥터
- 유닛 노드 열 뒤에 **SVG 곡선 커넥터**를 깐다. 노드 좌표는 DOM 측정 없이 **고정 지오메트리**로 계산:
  세로 피치 = 노드높이(68) + gap(18) 기반 상수, 가로 오프셋 = 기존 `SWAY` 배열.
- 연속 노드 중심 (x_i, y_i) → 사이를 **cubic bezier**로 연결. 완료 구간은 초록, 미완료는 회색 점선.
- 구현: `Path.jsx`의 각 유닛 `.nodes`에 `position:relative`, 뒤에 `<svg class="nodes__road">` 절대배치.
  노드는 그대로 위에 렌더. `pointer-events:none` on svg.

### 1-2. 현재 노드 바운스
- `.node--current .node__disc`에 **부드러운 상하 바운스** 키프레임(translateY, 2.2s ease-in-out).
- 기존 펄스링은 유지하되 은은하게(opacity 낮춤).

### 1-3. 고정 하단 "확인" 바
- 모든 문제 유형의 `확인` 버튼을 **sticky bottom `.action-bar`**로 통일(현재 WordBank/Listen만 적용됨 → Mcq/Match에도 래핑).
- 비활성=회색(현행 `.btn:disabled`), 활성=초록.

### 1-4. 오답 플로우 개편 (자동넘김 → 명시적 "계속")
- 현행: 정답 판정 후 550ms 타이머로 자동 진행.
- 변경: `Lesson`이 판정 즉시 **바텀시트** 표시하고 **타이머 제거**. 진행은 시트의 **"계속" 버튼** 클릭 시.
  - 정답: 초록 시트 "정답이에요! 🎉" + 계속
  - 오답: 빨강 시트 "정답: `<정답텍스트>`" + 계속
- **정답 텍스트는 Lesson이 exercise에서 파생**(컴포넌트 계약 `onAnswer(isCorrect)` 불변):
  - mcq → `exercise.answer`
  - wordbank/listen → `exercise.answer.join(' ')`
  - match → `exercise.pairs.map(([en,ko]) => en+'='+ko).join(', ')`
- 파생 함수 `correctAnswerText(exercise)`를 `engine/`에 순수 함수로 추가 + 단위테스트.
- SFX/onWrong 호출은 판정 시점 그대로. 진행 로직만 "계속"으로 이동.

### 1-5. 인레슨 콤보
- `Lesson`이 연속 정답 수 `combo` 추적(정답 +1, 오답 0). `combo >= 2`일 때 정답 시트에
  "🔥 콤보 x{combo}" 배지 표시. 순수 계산이라 별도 모듈 불필요(로컬 state).

### 1-6. 다크모드(auto) + 미세조정
- `:root` 라이트 토큰 + `@media (prefers-color-scheme: dark)`로 다크 토큰 오버라이드
  (배경·카드·라인·잉크). 브랜드색(초록/골드)은 유지, 대비만 보정.
- 카드 그림자·라운드·여백 톤 정리.

### Phase 1 테스트
- 신규 순수함수 `correctAnswerText(exercise)` 4유형 단위테스트.
- 기존 40 테스트 유지(컴포넌트 계약·텍스트 불변). 스모크: 레슨 진입→오답→시트에 정답노출→"계속"→다음.
- 라이브 검증: 경로 커넥터·다크모드(prefers-color-scheme)·오답시트 스크린샷.

### Phase 1 파일
- 수정: `src/components/Path.jsx`(커넥터), `src/components/Lesson.jsx`(시트·콤보·타이머제거),
  `src/components/exercises/Mcq.jsx`·`Match.jsx`(action-bar 래핑), `src/styles.css`(바운스·다크·시트),
  `src/App.jsx`(필요 시)
- 신규: `src/engine/answerText.js` + `tests/answerText.test.js`

---

## 4. Phase 2 스코프 — 모션·사운드 (B)

- **마스코트 반응 애니메이션**: `Duck`에 mood별 CSS/SVG 키프레임(눈깜빡·날개짓·정답 점프·오답 흔들). 순수 자체 제작.
- **사운드 고급화**: `audio/sfx.js`를 레이어드 WebAudio로 — 정답=상승 아르페지오(엔벨로프), 오답=소프트 버즈, 완료=짧은 징글. 외부파일 0.
- **햅틱**: `navigator.vibrate`(지원 시) 정답 짧게/오답 패턴. 미지원 무시.
- **컨페티 다양화** + 스트릭 상승 축하 모션.
- reduced-motion 준수.

## 5. Phase 3 스코프 — 구조·온보딩 (C)

- **앱 셸 + 하단 4탭**: 학습 / 퀘스트 / 상점 / 프로필. `App`을 셸+라우팅으로 리팩터(스크린 state 확장).
- **온보딩(최소형)**: 첫 실행(`onboarded=false`)에서 덕이 환영 → 일일목표(10/20/50/최대) → 시작레벨(유치원/초1/초2). 완료 시 `onboarded=true`, `dailyGoal` 저장. 언어선택 없음(영어 전용).
- **프로필**: 통계(총 XP·스트릭·완료 레슨·젬)·업적 목록·설정(다크모드 토글=settings.theme, 일일목표 변경, 진도 초기화).
- 퀘스트/상점 탭은 셸만(로직은 Phase 4).

## 6. Phase 4 스코프 — 게임요소 (D)

- **젬 재화**: 레슨 완료 +N, 완벽 보너스, 퀘스트 보상으로 획득(`engine/economy.js` 순수).
- **상점**: 하트 리필(가격), 스트릭 프리즈(가격, cap N). 젬 차감. 구매 순수함수+테스트.
- **일일 퀘스트**: 유형 예 — 오늘 XP 목표·레슨 N개·완벽 1회. 진행 추적·수령·자정 리셋(`engine/quests.js`).
- **업적/뱃지**: 첫 레슨·스트릭7·XP500·완벽10회 등 조건 판정·해금(`engine/achievements.js`).
- 리그/리더보드 **제외**.

## 7. 설계 원칙

- 순수 로직은 `engine/`에 분리, React와 무관하게 Vitest 단위테스트(TDD). UI는 상태 렌더만.
- 컴포넌트 공통 계약 유지(`exercise, onAnswer`) — Phase 1의 정답표시는 Lesson 파생으로 계약 불변.
- progress v2는 병합 마이그레이션으로 무중단 승격.
- 각 Phase 후 서버 띄워 Playwright/curl 라이브 스모크(3.14/단위테스트가 못 잡는 런타임·시각 확인).

## 8. 미해결/기본값

- 젬 획득·상점 가격 수치는 Phase 4 계획에서 확정(기본 제안: 레슨 +2젬, 완벽 +3, 하트리필 350젬, 프리즈 200젬).
- 다크모드 수동 토글은 Phase 3(프로필)에서. Phase 1은 auto만.
