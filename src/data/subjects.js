import english from './curriculum.json'
import math from './subjects/math.json'
import korean from './subjects/korean.json'
import essay from './subjects/essay.json'
import logic from './subjects/logic.json'

// Subject registry. ttsLang: locale for audio (null = no audio, e.g. math).
export const SUBJECTS = {
  english: { id: 'english', name: '영어', icon: '🔤', ttsLang: 'en-US', curriculum: english },
  math: { id: 'math', name: '수학', icon: '🔢', ttsLang: null, curriculum: math },
  korean: { id: 'korean', name: '국어', icon: '📖', ttsLang: 'ko-KR', curriculum: korean },
  essay: { id: 'essay', name: '논술', icon: '✍️', ttsLang: null, curriculum: essay },
  logic: { id: 'logic', name: '논리', icon: '🧩', ttsLang: null, curriculum: logic },
}

export const SUBJECT_LIST = Object.values(SUBJECTS)
export const DEFAULT_SUBJECT = 'english'

export function subjectMeta(id) {
  return SUBJECTS[id] || SUBJECTS[DEFAULT_SUBJECT]
}
