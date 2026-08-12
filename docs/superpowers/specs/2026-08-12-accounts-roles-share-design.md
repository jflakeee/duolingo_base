# 계정·역할·공유·구글로그인 설계

날짜: 2026-08-12
대상: Lingo Duck (`orca/workspaces/lingoduck`, main)

백엔드 0·localStorage 전용 PWA라는 제약 하에서 **전부 클라이언트로** 구현한다. 실제 서버 계정·실결제·서버 인증은 불가하며, 아래는 그 제약을 명시한 설계다.

## 정직성 고지 (설계 전제)
- 역할·운영자 권한은 **클라이언트 플래그**일 뿐 실제 보안이 아니다(localStorage 편집 가능). 학습앱 UX 게이팅 용도.
- 결제는 **젬(인앱 화폐)만** 사용, 실제 돈이 들어가지 않는다. 카드/계좌 입력 없음.
- 구글 로그인은 **백엔드 검증 없는** 클라이언트 신원(표시·회원 식별용).

## 데이터 모델 (`progress` v2 확장, loadProgress 병합 자동 마이그레이션)
- `memberId: string` — 최초 1회 생성 `LD-XXXX-XXXX`(대문자+숫자). 영구.
- `role: 'learner'|'parent'|'teacher'|'operator'` — 기본 `learner`. operator는 localhost 자동.
- `google: { sub, name, picture, email } | null` — 로그인 시 저장.

## A. 회원번호 + QR (진도 이관)
- **회원번호**: `engine/member.js` `generateMemberId(rand)` → `LD-XXXX-XXXX`. `ensureMemberId(progress, rand)`가 없으면 생성.
- **이관 페이로드**: `engine/transfer.js`
  - `encodeProgress(progress)` → 컴팩트 문자열. 포함: 버전·xp·streak.count·gems·dailyGoal·role·memberId·완료레슨 **비트마스크**(`getLessonSequence()` 순서 기준 431비트→base64url). reviewQueue·achievements·quests 제외(자연 재생성/비핵심).
  - `decodeProgress(code, current)` → 부분 progress 반환(현재값에 병합). 유효성 검사(prefix·버전).
- **QR**: `qrcode` 라이브러리(순수JS·오프라인·CSP 안전) 추가. `QRCode.toDataURL(code)` → `<img>`. 프로필에 표시.
- **가져오기**: QR 표시 + **코드 복사**(navigator.clipboard) + **코드 붙여넣기 가져오기**(textarea→decode→확인 후 적용). 카메라 스캔은 비범위(폰 카메라앱으로 디코드 후 붙여넣기).

## B. 운영자 권한 (localhost 자동)
- `engine/roles.js` `isDevHost(hostname)` → localhost/127.0.0.1/::1. `resolveRole(progress, hostname)` → dev면 `operator`, 아니면 `progress.role`.
- **운영자 패널**(프로필, operator만): 젬 지급(+100)·역할 강제 변경·전 레슨 잠금해제(completedLessons=전체)·초기화.

## C. 부모/선생 역할 → 젬 구매·선물
- **역할 선택기**(프로필): learner/parent/teacher 세그먼트. operator는 localhost로만(선택기엔 비노출, 패널로 강제).
- **구매/선물 패널**(parent·teacher·operator): `engine/gifting.js`
  - 구매 목록: 하트 리필(젬)·스트릭 프리즈(젬)·젬 팩(operator 무료 지급). 기존 `economy.js` 재사용.
  - **선물**: `makeGift(item, gems)` → 선물 페이로드 인코딩(transfer와 동일 코덱 계열) → QR/코드. 받는 사람이 A의 가져오기로 수령(`applyGift`). 젬 차감은 보내는 쪽.

## D. 구글 로그인
- `src/authConfig.js`: `GOOGLE_CLIENT_ID`(빈 문자열 기본). 미설정 시 로그인 UI 숨김.
- `auth/google.js`: GIS 스크립트 동적 로드(`accounts.google.com/gsi/client`), `initGoogle(clientId, cb)`·`renderButton(el)`·`parseIdToken(jwt)`(payload base64 디코드로 sub/name/picture/email). 서버 검증 없음.
- 로그인 성공 → `progress.google` 저장, 프로필에 이름·사진. 로그아웃=해제.
- ⚠️ 온라인 전용·외부 스크립트. 승인 출처에 배포 URL·localhost 등록은 사용자 몫.

## 컴포넌트
- `components/Profile.jsx` 확장: 회원번호·QR·가져오기·역할 선택기·(role별)구매/선물·(operator)운영자 패널·(D)구글 로그인/프로필.
- 큰 블록은 하위 컴포넌트로 분리: `ShareCard.jsx`(회원번호+QR+가져오기), `RolePanel.jsx`(역할+구매/선물+운영자), `GoogleAuth.jsx`.

## 테스트
- 순수 로직 단위테스트: member(생성 포맷·안정성)·transfer(encode/decode 왕복·비트마스크·잘못된 코드)·roles(isDevHost·resolveRole)·gifting(makeGift/applyGift·젬 차감).
- QR 렌더/GIS는 외부/DOM → 스모크·모킹(Client ID 없으면 버튼 없음 검증).
- 기존 112 pass 유지.

## 구현 순서(각 TDD·검증·배포)
A(회원번호+QR) → B(역할·운영자) → C(젬 구매/선물) → D(구글 로그인).

## 비목표 (YAGNI)
- 서버 계정·실결제·서버 토큰 검증·카메라 QR 스캐너·크로스기기 실시간 동기화.
