// Data pools for procedural practice generators. Words kept distinct within each set so
// distractor sampling never collides (invariant: 4 distinct mcq/picture choices).

// Emoji vocab pools ({ word, ko, emoji }) — enable picture/mcq/typein.
export const POOLS = {
  colors: [
    { word: 'red', ko: '빨강', emoji: '🔴' }, { word: 'blue', ko: '파랑', emoji: '🔵' },
    { word: 'green', ko: '초록', emoji: '🟢' }, { word: 'yellow', ko: '노랑', emoji: '🟡' },
    { word: 'orange', ko: '주황', emoji: '🟠' }, { word: 'purple', ko: '보라', emoji: '🟣' },
    { word: 'black', ko: '검정', emoji: '⚫' }, { word: 'white', ko: '흰색', emoji: '⚪' },
  ],
  animals: [
    { word: 'cat', ko: '고양이', emoji: '🐱' }, { word: 'dog', ko: '개', emoji: '🐶' },
    { word: 'fish', ko: '물고기', emoji: '🐟' }, { word: 'bird', ko: '새', emoji: '🐤' },
    { word: 'rabbit', ko: '토끼', emoji: '🐰' }, { word: 'bear', ko: '곰', emoji: '🐻' },
    { word: 'lion', ko: '사자', emoji: '🦁' }, { word: 'mouse', ko: '쥐', emoji: '🐭' },
  ],
  food: [
    { word: 'apple', ko: '사과', emoji: '🍎' }, { word: 'bread', ko: '빵', emoji: '🍞' },
    { word: 'milk', ko: '우유', emoji: '🥛' }, { word: 'rice', ko: '밥', emoji: '🍚' },
    { word: 'egg', ko: '달걀', emoji: '🥚' }, { word: 'banana', ko: '바나나', emoji: '🍌' },
    { word: 'grape', ko: '포도', emoji: '🍇' }, { word: 'cake', ko: '케이크', emoji: '🍰' },
  ],
  family: [
    { word: 'mother', ko: '엄마', emoji: '👩' }, { word: 'father', ko: '아빠', emoji: '👨' },
    { word: 'baby', ko: '아기', emoji: '👶' }, { word: 'sister', ko: '누나', emoji: '👧' },
    { word: 'brother', ko: '형', emoji: '👦' }, { word: 'grandmother', ko: '할머니', emoji: '👵' },
    { word: 'grandfather', ko: '할아버지', emoji: '👴' },
  ],
  weather: [
    { word: 'sunny', ko: '맑음', emoji: '☀️' }, { word: 'rainy', ko: '비', emoji: '🌧️' },
    { word: 'snowy', ko: '눈', emoji: '❄️' }, { word: 'cloudy', ko: '흐림', emoji: '⛅' },
    { word: 'windy', ko: '바람', emoji: '🌬️' }, { word: 'rainbow', ko: '무지개', emoji: '🌈' },
    { word: 'stormy', ko: '폭풍', emoji: '⛈️' }, { word: 'foggy', ko: '안개', emoji: '🌫️' },
  ],
  feelings: [
    { word: 'happy', ko: '행복한', emoji: '😀' }, { word: 'sad', ko: '슬픈', emoji: '😢' },
    { word: 'angry', ko: '화난', emoji: '😠' }, { word: 'scared', ko: '무서운', emoji: '😨' },
    { word: 'tired', ko: '피곤한', emoji: '😫' }, { word: 'surprised', ko: '놀란', emoji: '😲' },
    { word: 'sleepy', ko: '졸린', emoji: '😴' }, { word: 'excited', ko: '신나는', emoji: '🤩' },
  ],
  school: [
    { word: 'book', ko: '책', emoji: '📚' }, { word: 'pencil', ko: '연필', emoji: '✏️' },
    { word: 'bag', ko: '가방', emoji: '🎒' }, { word: 'ruler', ko: '자', emoji: '📏' },
    { word: 'pen', ko: '펜', emoji: '🖊️' }, { word: 'scissors', ko: '가위', emoji: '✂️' },
    { word: 'notebook', ko: '공책', emoji: '📓' }, { word: 'crayon', ko: '크레용', emoji: '🖍️' },
  ],
  body: [
    { word: 'hand', ko: '손', emoji: '✋' }, { word: 'foot', ko: '발', emoji: '🦶' },
    { word: 'eye', ko: '눈', emoji: '👀' }, { word: 'ear', ko: '귀', emoji: '👂' },
    { word: 'nose', ko: '코', emoji: '👃' }, { word: 'mouth', ko: '입', emoji: '👄' },
    { word: 'tooth', ko: '이', emoji: '🦷' }, { word: 'tongue', ko: '혀', emoji: '👅' },
  ],
  clothes: [
    { word: 'shirt', ko: '셔츠', emoji: '👕' }, { word: 'pants', ko: '바지', emoji: '👖' },
    { word: 'dress', ko: '드레스', emoji: '👗' }, { word: 'socks', ko: '양말', emoji: '🧦' },
    { word: 'hat', ko: '모자', emoji: '🧢' }, { word: 'shoes', ko: '신발', emoji: '👟' },
    { word: 'coat', ko: '코트', emoji: '🧥' }, { word: 'gloves', ko: '장갑', emoji: '🧤' },
  ],
  jobs: [
    { word: 'teacher', ko: '선생님', emoji: '🧑‍🏫' }, { word: 'doctor', ko: '의사', emoji: '🧑‍⚕️' },
    { word: 'police', ko: '경찰', emoji: '👮' }, { word: 'cook', ko: '요리사', emoji: '🧑‍🍳' },
    { word: 'farmer', ko: '농부', emoji: '🧑‍🌾' }, { word: 'pilot', ko: '조종사', emoji: '🧑‍✈️' },
    { word: 'artist', ko: '화가', emoji: '🧑‍🎨' }, { word: 'singer', ko: '가수', emoji: '🧑‍🎤' },
  ],
  sports: [
    { word: 'soccer', ko: '축구', emoji: '⚽' }, { word: 'basketball', ko: '농구', emoji: '🏀' },
    { word: 'tennis', ko: '테니스', emoji: '🎾' }, { word: 'swimming', ko: '수영', emoji: '🏊' },
    { word: 'running', ko: '달리기', emoji: '🏃' }, { word: 'cycling', ko: '자전거', emoji: '🚴' },
    { word: 'baseball', ko: '야구', emoji: '⚾' }, { word: 'skiing', ko: '스키', emoji: '⛷️' },
  ],
  transport: [
    { word: 'car', ko: '자동차', emoji: '🚗' }, { word: 'bus', ko: '버스', emoji: '🚌' },
    { word: 'train', ko: '기차', emoji: '🚂' }, { word: 'plane', ko: '비행기', emoji: '✈️' },
    { word: 'bike', ko: '자전거', emoji: '🚲' }, { word: 'ship', ko: '배', emoji: '🚢' },
    { word: 'taxi', ko: '택시', emoji: '🚕' }, { word: 'subway', ko: '지하철', emoji: '🚇' },
  ],
  nature: [
    { word: 'tree', ko: '나무', emoji: '🌳' }, { word: 'flower', ko: '꽃', emoji: '🌸' },
    { word: 'sea', ko: '바다', emoji: '🌊' }, { word: 'mountain', ko: '산', emoji: '⛰️' },
    { word: 'moon', ko: '달', emoji: '🌙' }, { word: 'sun', ko: '해', emoji: '☀️' },
    { word: 'star', ko: '별', emoji: '⭐' }, { word: 'cloud', ko: '구름', emoji: '☁️' },
  ],
  house: [
    { word: 'house', ko: '집', emoji: '🏠' }, { word: 'door', ko: '문', emoji: '🚪' },
    { word: 'window', ko: '창문', emoji: '🪟' }, { word: 'bed', ko: '침대', emoji: '🛏️' },
    { word: 'chair', ko: '의자', emoji: '🪑' }, { word: 'lamp', ko: '전등', emoji: '💡' },
    { word: 'key', ko: '열쇠', emoji: '🔑' }, { word: 'clock', ko: '시계', emoji: '🕐' },
  ],
}

// { word, ko, opposite } — words distinct across all pairs.
export const ANTONYMS = [
  { word: 'big', ko: '큰', opposite: 'small' }, { word: 'hot', ko: '뜨거운', opposite: 'cold' },
  { word: 'fast', ko: '빠른', opposite: 'slow' }, { word: 'tall', ko: '키 큰', opposite: 'short' },
  { word: 'happy', ko: '행복한', opposite: 'sad' }, { word: 'old', ko: '낡은', opposite: 'new' },
  { word: 'good', ko: '좋은', opposite: 'bad' }, { word: 'easy', ko: '쉬운', opposite: 'hard' },
  { word: 'high', ko: '높은', opposite: 'low' }, { word: 'strong', ko: '강한', opposite: 'weak' },
  { word: 'rich', ko: '부유한', opposite: 'poor' }, { word: 'early', ko: '이른', opposite: 'late' },
  { word: 'open', ko: '열린', opposite: 'closed' }, { word: 'light', ko: '밝은', opposite: 'dark' },
  { word: 'clean', ko: '깨끗한', opposite: 'dirty' }, { word: 'full', ko: '가득 찬', opposite: 'empty' },
  { word: 'wet', ko: '젖은', opposite: 'dry' }, { word: 'up', ko: '위', opposite: 'down' },
]

// { base, past, ko } — past forms distinct.
export const VERBS = [
  { base: 'go', past: 'went', ko: '가다' }, { base: 'eat', past: 'ate', ko: '먹다' },
  { base: 'see', past: 'saw', ko: '보다' }, { base: 'come', past: 'came', ko: '오다' },
  { base: 'do', past: 'did', ko: '하다' }, { base: 'make', past: 'made', ko: '만들다' },
  { base: 'take', past: 'took', ko: '가져가다' }, { base: 'get', past: 'got', ko: '얻다' },
  { base: 'give', past: 'gave', ko: '주다' }, { base: 'know', past: 'knew', ko: '알다' },
  { base: 'think', past: 'thought', ko: '생각하다' }, { base: 'buy', past: 'bought', ko: '사다' },
  { base: 'run', past: 'ran', ko: '달리다' }, { base: 'write', past: 'wrote', ko: '쓰다' },
  { base: 'drink', past: 'drank', ko: '마시다' }, { base: 'drive', past: 'drove', ko: '운전하다' },
  { base: 'fly', past: 'flew', ko: '날다' }, { base: 'sleep', past: 'slept', ko: '자다' },
  { base: 'meet', past: 'met', ko: '만나다' },
]

// { word, ko, synonym } — words distinct across all pairs.
export const SYNONYMS = [
  { word: 'big', ko: '큰', synonym: 'large' }, { word: 'small', ko: '작은', synonym: 'little' },
  { word: 'happy', ko: '행복한', synonym: 'glad' }, { word: 'smart', ko: '똑똑한', synonym: 'clever' },
  { word: 'fast', ko: '빠른', synonym: 'quick' }, { word: 'begin', ko: '시작하다', synonym: 'start' },
  { word: 'buy', ko: '사다', synonym: 'purchase' }, { word: 'help', ko: '돕다', synonym: 'assist' },
  { word: 'hard', ko: '어려운', synonym: 'difficult' }, { word: 'easy', ko: '쉬운', synonym: 'simple' },
  { word: 'angry', ko: '화난', synonym: 'mad' }, { word: 'rich', ko: '부유한', synonym: 'wealthy' },
  { word: 'close', ko: '가까운', synonym: 'near' }, { word: 'huge', ko: '거대한', synonym: 'enormous' },
  { word: 'tired', ko: '피곤한', synonym: 'exhausted' }, { word: 'correct', ko: '맞는', synonym: 'right' },
]

// { word, ko } — business/formal vocabulary.
export const BUSINESS = [
  { word: 'meeting', ko: '회의' }, { word: 'deadline', ko: '마감' }, { word: 'schedule', ko: '일정' },
  { word: 'report', ko: '보고서' }, { word: 'client', ko: '고객' }, { word: 'invoice', ko: '청구서' },
  { word: 'budget', ko: '예산' }, { word: 'contract', ko: '계약' }, { word: 'salary', ko: '급여' },
  { word: 'manager', ko: '관리자' }, { word: 'project', ko: '프로젝트' }, { word: 'presentation', ko: '발표' },
  { word: 'email', ko: '이메일' }, { word: 'agenda', ko: '안건' }, { word: 'colleague', ko: '동료' },
  { word: 'feedback', ko: '피드백' },
]
