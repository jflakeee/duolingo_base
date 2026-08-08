# Lingo Duck — 설계 문서

> 작성일: 2026-08-08 · 상태: 설계 확정 대기(사용자 리뷰)

## 1. 목표와 범위

듀오링고의 **핵심 사용자경험(게이미피케이션 + 레슨 루프)** 을 거의 동일하게 재현하되,
마스코트·색·로고·강의 콘텐츠는 **오리지널**로 새로 만드는 광고 없는 영어 학습 웹앱.

- 스택: **React + Vite SPA**, 백엔드 없음. 진도는 브라우저 localStorage.
- 플랫폼: **웹(모바일 우선 반응형)**.
- 학습자: **범용**(연령 무관). UI는 한글, 학습 대상은 영어.
- 난이도 단계: **유치원 → 초1 → 초2 …** 단계별 레벨.
- 콘텐츠: **수작업 씨앗 커리큘럼(JSON)**. 외부 의존 0, 항상 동작.
- 위치: `C:\Users\a\orca\workspaces\lingoduck` (finsearch와 완전 별도 repo).

### 명시적 비범위 (YAGNI)
- 서버/로그인/계정, 결제, 광고, 소셜 리그/친구
- 말하기(마이크) 채점, 실시간 AI 문제 생성
- 픽셀단위 듀오링고 복제(저작권/상표 회피)

## 2. 재현할 듀오링고 UX (딥리서치 요약)

| 요소 | 재현 방식 |
|---|---|
| 스킬트리(경로) | 레벨 → 유닛 → 레슨 노드가 세로 경로로 나열, 순차 잠금 해제 |
| 레슨 세션 | 문제 5~10개 연속 풀이 → 진행바 → 결과 화면 |
| 하트(생명) | 오답마다 -1, 0이면 세션 실패. 세션 밖에서 시간/복습으로 회복 |
| XP | 레슨 완료·정답마다 획득, 일일 목표 게이지 |
| 스트릭 | 매일 1레슨 이상 시 연속일 +1, 놓치면 리셋(프리즈 1개 보유) |
| 즉각 피드백 | 정답=초록+효과음, 오답=빨강+정답 노출 |
| 오답 재출제 | 세션 종료 시 틀린 문제를 큐에 다시 넣어 반복 |
| 마스코트 격려 | 오리지널 캐릭터 "덕이"가 상황별 반응(정답/오답/완료) |

> 필요 시 별도 deep-research 하니스로 더 깊게 확장 가능(현재는 통념 수준 재현).

## 3. 오리지널 브랜딩 (초안, 변경 가능)

- 앱 이름: **Lingo Duck (링고덕)**
- 마스코트: 노란 오리 **"덕이"** (부엉이 아님)
- 팔레트: 프레시 그린(주) + 옐로(포인트) — 듀오링고와 구분되는 자체 색
- 마스코트/아이콘은 인라인 SVG로 자체 제작(외부 에셋·상표 미사용)

## 4. 아키텍처

```
lingoduck/
  index.html
  package.json / vite.config.js
  src/
    main.jsx
    App.jsx                  # 라우팅(경로 화면 ↔ 레슨 화면)
    data/
      curriculum.json        # 손수 씨앗 커리큘럼(레벨/유닛/레슨/문제)
    engine/
      session.js             # 레슨 상태머신: 문제 큐·채점·오답 재출제
      scoring.js             # 정답 판정(유형별)
      gamification.js        # 하트·XP·스트릭 규칙(순수 함수)
    store/
      progress.js            # localStorage 로드/세이브(진도·XP·스트릭·하트)
    audio/
      tts.js                 # Web Speech API 발음(공짜)
      sfx.js                 # 정답/오답 효과음(WebAudio 비프, 에셋 0)
    components/
      Path.jsx               # 스킬트리/경로
      Header.jsx             # 하트·XP·스트릭 표시
      Lesson.jsx             # 세션 진행 컨테이너 + 진행바
      Result.jsx             # 결과 화면
      Duck.jsx               # 마스코트 SVG + 반응
      exercises/
        Mcq.jsx              # 객관식(뜻/그림 고르기)
        WordBank.jsx         # 단어은행 문장조립
        Listen.jsx           # 듣기(TTS 받아쓰기)
        Match.jsx            # 짝맞추기 매칭
```

### 설계 원칙(격리·테스트 용이성)
- `engine/*`, `store/*`, `audio/*` 는 **순수 로직**으로 React와 분리 → 단위 테스트 가능.
- 채점·게이미피케이션은 입력→출력 순수 함수. UI는 상태를 렌더만.
- 문제 유형 컴포넌트는 공통 인터페이스: `props { exercise, onAnswer(correct:boolean) }`.

## 5. 데이터 모델 (curriculum.json)

```jsonc
{
  "levels": [
    {
      "id": "kinder",
      "name": "유치원",
      "units": [
        {
          "id": "kinder-u1",
          "title": "인사와 색깔",
          "lessons": [
            {
              "id": "kinder-u1-l1",
              "title": "Hello",
              "exercises": [
                {
                  "type": "mcq",
                  "prompt": "‘안녕’은 영어로?",
                  "choices": ["Hello", "Bye", "Cat", "Red"],
                  "answer": "Hello",
                  "audioText": "Hello"
                },
                {
                  "type": "wordbank",
                  "prompt": "문장을 만드세요: ‘나는 고양이를 좋아해’",
                  "tokens": ["I", "like", "cats"],
                  "distractors": ["dog", "you"],
                  "answer": ["I", "like", "cats"],
                  "audioText": "I like cats"
                },
                {
                  "type": "listen",
                  "prompt": "들리는 문장을 완성하세요",
                  "tokens": ["I", "am", "happy"],
                  "distractors": ["sad", "you"],
                  "answer": ["I", "am", "happy"],
                  "audioText": "I am happy"
                },
                {
                  "type": "match",
                  "prompt": "짝을 맞추세요",
                  "pairs": [["red", "빨강"], ["blue", "파랑"], ["green", "초록"]]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

- 유형별 필드는 위 스키마로 고정. 채점기는 `type`으로 분기.
- 씨앗 분량: **유치원 2유닛 + 초1 2유닛**, 각 유닛 2~3레슨(레슨당 문제 5~8개).

## 6. 게이미피케이션 규칙 (초기값)

- 하트: 시작 5개. 오답 -1. 0이면 세션 실패 화면. 세션 밖에서 30분당 +1 회복(또는 완벽 복습 시 +1).
- XP: 정답 +10, 무실수 레슨 보너스 +20. 일일 목표 기본 50 XP.
- 스트릭: 하루 1레슨 이상 완료 시 +1. 자정(로컬) 기준 놓치면 리셋. 프리즈 1개로 1일 보호.
- 오답 재출제: 세션 중 틀린 문제를 큐 뒤에 다시 넣어 그 세션 안에서 반드시 재도전.

## 7. 진도 저장 (localStorage 스키마)

```jsonc
{
  "version": 1,
  "xp": 0,
  "hearts": 5,
  "heartsUpdatedAt": 0,
  "streak": { "count": 0, "lastDay": null, "freezes": 1 },
  "completedLessons": ["kinder-u1-l1"],
  "dailyXp": { "day": "2026-08-08", "amount": 0 }
}
```

- 단일 사용자·기기 로컬. 초기화(설정에서 진도 리셋) 제공.

## 8. 오디오

- 발음: 브라우저 **Web Speech API `SpeechSynthesis`** (en-US). 에셋·비용 0.
- 효과음: **WebAudio 비프**(정답 상승음/오답 하강음) — 외부 파일 없음.
- 미지원 브라우저: 발음 버튼 비활성 + 텍스트 대체.

## 9. 테스트 전략

- 단위(Vitest): `scoring`(4유형 정답/오답), `gamification`(하트/XP/스트릭 경계·자정 롤오버), `session`(오답 재출제 큐), `progress`(load/save/리셋).
- 스모크: 앱 부팅 → 레슨 1개 클리어 → 진도 반영(Playwright/webapp-testing로 선택적).

## 10. 마일스톤(구현 계획에서 세분화)

1. Vite 스캐폴드 + 라우팅 + 헤더/경로 껍데기
2. curriculum.json 씨앗 + 데이터 로더
3. 문제 유형 4종 컴포넌트 + scoring
4. 세션 상태머신(진행바·오답 재출제) + 결과 화면
5. 게이미피케이션(하트/XP/스트릭) + progress 저장
6. 오디오(TTS/효과음) + 마스코트 반응
7. 반응형/모바일 마감 + 테스트

## 11. 열린 결정(기본값으로 진행, 이견 시 변경)

- 앱 이름/마스코트: Lingo Duck / 오리 "덕이" (기본값).
- 그림 고르기: MVP는 이모지/SVG 아이콘으로 대체(이미지 에셋 최소화).
