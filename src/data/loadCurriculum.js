import { SUBJECTS, DEFAULT_SUBJECT } from './subjects.js'

function curriculumOf(subject) {
  return (SUBJECTS[subject] || SUBJECTS[DEFAULT_SUBJECT]).curriculum
}

export function getLevels(subject = DEFAULT_SUBJECT) {
  return curriculumOf(subject).levels
}

// Flat, ordered list of every lesson with its level/unit context (per subject).
export function getLessonSequence(subject = DEFAULT_SUBJECT) {
  const seq = []
  for (const level of curriculumOf(subject).levels) {
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        seq.push({ levelId: level.id, unitId: unit.id, lesson })
      }
    }
  }
  return seq
}

export function getLessonById(lessonId, subject = DEFAULT_SUBJECT) {
  return getLessonSequence(subject).find((x) => x.lesson.id === lessonId)?.lesson ?? null
}
