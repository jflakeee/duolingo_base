# Lingo Duck

광고 없는 오리지널 영어 학습 웹앱. 듀오링고의 핵심 게이미피케이션(하트·XP·스트릭·레슨 루프)을 재현하되 마스코트/색/콘텐츠는 자체 제작.

## 실행
```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm test         # 단위 테스트
```

## 구조
- `src/engine/*` — 채점·게이미피케이션·세션 상태머신(순수 로직, 테스트 대상)
- `src/store/progress.js` — localStorage 진도
- `src/data/curriculum.json` — 손수 씨앗 커리큘럼(레벨→유닛→레슨→문제)
- `src/components/*` — UI (경로·헤더·레슨·결과·4개 문제 유형)
- `src/audio/*` — Web Speech 발음 + WebAudio 효과음

## 콘텐츠 추가
`curriculum.json`에 레벨/유닛/레슨/문제를 스키마대로 추가하면 자동 반영.
