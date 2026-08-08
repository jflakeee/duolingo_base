import curriculum from './curriculum.json'

export function getLevels() {
  return curriculum.levels
}

// Flat, ordered list of every lesson with its level/unit context.
export function getLessonSequence() {
  const seq = []
  for (const level of curriculum.levels) {
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        seq.push({ levelId: level.id, unitId: unit.id, lesson })
      }
    }
  }
  return seq
}

export function getLessonById(lessonId) {
  return getLessonSequence().find((x) => x.lesson.id === lessonId)?.lesson ?? null
}
