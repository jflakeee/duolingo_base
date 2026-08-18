# "내 문제집" 커스텀 덱 과목 설계

날짜: 2026-08-18
상태: 설계 승인 → 구현
대상: Lingo Duck (main)

`idea_duolingo.md`의 마지막 항목 "문제집 스캔 PDF 기반 반복 학습, 오답 노트" 중 남은 부분. 오답노트(SRS)는 이미 구현됨. 백엔드 0(클라이언트 전용 PWA) 제약에서 스캔 이미지 OCR은 한국어 품질·무게 문제로 비목표. 대신 사용자가 문제를 **일괄 붙여넣기**로 입력하는 **커스텀 덱**을 새 과목으로 담는다.

## 1. 목표 / 비목표
**목표**
- 사용자가 자신의 문제(문제집에서 옮겨 적은)를 붙여넣어 **덱**을 만들고, 기존 레슨 루프·하트·XP·젬·스트릭·SRS·오답노트로 반복 학습.
- 덱을 QR/코드로 공유(선생님·부모가 학생에게 배포).

**비목표 (백엔드/LLM 없음)**
- 스캔 이미지 OCR·자동 문제 추출·PDF 파싱.
- 서버 저장·실시간 동기화.

## 2. 결정 (브레인스토밍 확정)
1. 접근: 수동 커스텀 덱(OCR 없음).
2. 통합: **새 과목 탭 '내 문제집'**(기존 과목 아키텍처 재사용).
3. 입력: **일괄 붙여넣기만**(폼 UI 생략).
4. 유형: **mcq + typein**(둘 다 자동채점→SRS).
5. 공유: **QR/코드(LDD1)** — 기존 이관 인프라 패턴.

## 3. 데이터 모델
- `progress.decks: [{ id, name, exercises: Exercise[], createdAt }]` — 사용자 작성 덱(콘텐츠). 기존 `progress`에 포함돼 localStorage 자동 저장. `defaultProgress`에 `decks: []` 추가, `loadProgress` 병합으로 기존 사용자 무손실.
- 진도: 기존 그대로 `progress.subjects.custom = { completedLessons, reviewQueue }`. **콘텐츠(decks)와 진도(subjects.custom) 분리** — 메타게임·SRS·오답노트 전부 기존 과목 기계 재사용.
- Exercise: 기존 스키마 재사용. `{ type:'typein', prompt, answer }` 또는 `{ type:'mcq', prompt, choices[≤4], answer }`.

## 4. 커리큘럼 파생 (핵심)
- `data/customSubject.js`:
  - `buildCustomCurriculum(decks)` → `{ levels }`. 덱 1개 = 레벨 1개(`id=deck.id`, `name=deck.name`), 덱 exercises를 **5개씩 lessons로 청크**, 단일 unit.
  - 가변 홀더 `CUSTOM_HOLDER = { curriculum: { levels: [] } }`. `SUBJECTS.custom.curriculum`이 이 홀더를 참조.
  - `setCustomCurriculum(decks)` → 홀더 갱신.
- `App` 렌더 최상단(=`lessonsById` 계산과 같은 위치)에서 `setCustomCurriculum(progress.decks)` 호출. 동기 실행이라 자식(로더·Path·SRS)이 최신 커리큘럼을 봄.
- 근거: `getLevels/getLessonById`가 `SUBJECTS[subject].curriculum`을 읽음. 커스텀만 동적이므로 **가변 홀더가 단일 통제 지점**. 대안(진도를 로더 인자로 스레딩)은 App 전반 침습적이라 비채택.

## 5. 붙여넣기 파서
- `engine/deckParser.js`: `parseDeck(text)` → `{ exercises, errors }`. 순수.
  - 줄 단위. 파이프(`|`)로 필드 분리, 각 필드 trim, 빈 줄 무시.
  - 필드 2개: `질문 | 정답` → `typein`.
  - 필드 ≥3개: `질문 | 정답 | 오답…` → `mcq`(첫 필드=질문, 둘째=정답, 나머지=오답). 보기 = [정답, ...오답] 중복 제거 후 최대 4개. 오답이 하나도 없으면(중복 제거 후 보기 1개) 에러.
  - 필드 1개/질문 없음/정답 없음 → `errors`에 `{ line, text, reason }` 수집.
  - 반환 exercises는 채점 불변식 충족(mcq: answer∈choices·보기 distinct, typein: answer 비어있지 않음).
- 형식 안내 문구를 붙여넣기 화면에 예시와 함께 표시.

## 6. UI
- `components/DeckManager.jsx`: 붙여넣기 textarea + "덱 만들기"(이름 입력) · 덱 목록(이름·문제 수·이름변경·삭제·공유 버튼) · 파서 에러 표시.
- Path 통합: 커스텀 과목 선택 시 — 덱 0개면 Path 대신 DeckManager(빈 상태 CTA), 덱 ≥1이면 기존 Path(덱=레벨) + 상단 "📚 문제집 관리" 버튼으로 DeckManager 진입.
- 과목 탭: `SUBJECTS.custom`(icon 📓, ttsLang null) 자동 노출(기존 SUBJECT_LIST 순회).

## 7. 공유 (LDD1)
- `engine/deckShare.js`: `encodeDeck(deck)` → `'LDD1:' + base64url(JSON({n:name, e:exercises}))`, `decodeDeck(code)` → `{ name, exercises }` 또는 null. 기존 messages.js encStr/decStr 패턴 재사용(UTF-8).
- `App.importCode`에 LDD1 분기: 디코드 성공 시 `progress.decks`에 새 id로 추가 → `{ ok:true, message:'문제집을 받았어요! 📚' }`.
- 공유 UI: DeckManager 덱별 "공유"가 코드/QR 생성(기존 ShareCard/QR 재사용).
- ⚠️ QR 용량: 큰 덱은 코드가 길어짐. 공유용 덱 문제 수 상한(**50**) — 초과 시 경고. 코드 텍스트 복사는 항상 가능.

## 8. 테스트
- `deckParser.test`: typein/mcq 분기·중복 보기 제거·에러 수집·불변식.
- `customSubject.test`: 덱→레벨·5개 청크·빈 덱=레벨 0.
- `deckShare.test`: encode→decode 왕복·잘못된 코드 null·한글 보존.
- `mistakes`/기존 SRS가 custom 과목 오답도 집계(레지스트리 순회에 custom 포함 확인).
- 라이브: 붙여넣기→덱 생성→레슨 풀이(mcq·typein)→오답 발생→오답노트 custom 그룹 반영→QR/코드 공유 왕복 가져오기.

## 9. 마이그레이션·호환
- `defaultProgress().decks = []`, `subjects.custom` 최초 접근 시 `{ completedLessons:[], reviewQueue:[] }` 기본. 기존 사용자 무손실.
- 영어·수학·국어·논술·논리 및 기존 테스트 영향 0(커스텀은 추가만).

## 10. 리스크
- 가변 홀더 커리큘럼: App 최상단 동기 갱신 순서 의존. 완화=`lessonsById`와 동일 위치·동기.
- QR 용량: 상한+경고로 완화.
- 붙여넣기 형식 학습곡선: 화면 예시·에러 라인 안내로 완화.
