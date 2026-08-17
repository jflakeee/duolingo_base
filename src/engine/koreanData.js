// Korean subject data pools. Words distinct within each set for clean distractor sampling.

export const KO_ANTONYMS = [
  { word: '크다', opposite: '작다' }, { word: '빠르다', opposite: '느리다' },
  { word: '높다', opposite: '낮다' }, { word: '밝다', opposite: '어둡다' },
  { word: '무겁다', opposite: '가볍다' }, { word: '뜨겁다', opposite: '차갑다' },
  { word: '많다', opposite: '적다' }, { word: '길다', opposite: '짧다' },
  { word: '넓다', opposite: '좁다' }, { word: '깊다', opposite: '얕다' },
  { word: '새롭다', opposite: '낡다' }, { word: '강하다', opposite: '약하다' },
  { word: '기쁘다', opposite: '슬프다' }, { word: '쉽다', opposite: '어렵다' },
]

export const KO_SYNONYMS = [
  { word: '거대하다', synonym: '커다랗다' }, { word: '신속하다', synonym: '재빠르다' },
  { word: '예쁘다', synonym: '아름답다' }, { word: '똑똑하다', synonym: '영리하다' },
  { word: '즐겁다', synonym: '유쾌하다' }, { word: '서글프다', synonym: '슬프다' },
  { word: '돕다', synonym: '거들다' }, { word: '시작하다', synonym: '개시하다' },
  { word: '풍부하다', synonym: '넉넉하다' }, { word: '튼튼하다', synonym: '견고하다' },
  { word: '조용하다', synonym: '고요하다' }, { word: '깨끗하다', synonym: '청결하다' },
]

// { correct, wrongs[] } — 옳은 표기 + 흔한 오기(맞춤법·띄어쓰기).
export const KO_SPELLING = [
  { correct: '며칠', wrongs: ['몇일', '몇 일', '며 칠'] },
  { correct: '왠지', wrongs: ['웬지', '웬 지', '왠 지'] },
  { correct: '설레다', wrongs: ['설레이다', '설래다', '설레히다'] },
  { correct: '금세', wrongs: ['금새', '금 세', '금 새'] },
  { correct: '희한하다', wrongs: ['희안하다', '희얀하다', '희한 하다'] },
  { correct: '깨끗이', wrongs: ['깨끗히', '깨끝이', '깨끗 이'] },
  { correct: '곰곰이', wrongs: ['곰곰히', '곰 곰이', '곰곰 이'] },
  { correct: '설거지', wrongs: ['설겆이', '설것이', '설거 지'] },
]

export const KO_SENTENCES = [
  '오늘 날씨가 참 좋아요.',
  '저는 책 읽는 것을 좋아해요.',
  '우리 가족은 공원에 갔어요.',
  '내일은 학교에 일찍 갈 거예요.',
  '친구와 함께 점심을 먹었어요.',
  '봄이 되면 꽃이 활짝 핍니다.',
  '동생은 그림 그리기를 잘해요.',
  '주말에 할머니 댁에 놀러 갔어요.',
]
