import english from './curriculum.json'
import math from './subjects/math.json'

// Subject registry. ttsLang: locale for audio (null = no audio, e.g. math).
export const SUBJECTS = {
  english: { id: 'english', name: '영어', icon: '🔤', ttsLang: 'en-US', curriculum: english },
  math: { id: 'math', name: '수학', icon: '🔢', ttsLang: null, curriculum: math },
}

export const SUBJECT_LIST = Object.values(SUBJECTS)
export const DEFAULT_SUBJECT = 'english'

export function subjectMeta(id) {
  return SUBJECTS[id] || SUBJECTS[DEFAULT_SUBJECT]
}
