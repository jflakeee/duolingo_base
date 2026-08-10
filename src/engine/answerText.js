// Human-readable correct answer for display in the lesson answer sheet.
export function correctAnswerText(exercise) {
  switch (exercise.type) {
    case 'mcq':
      return exercise.answer
    case 'wordbank':
    case 'listen':
      return exercise.answer.join(' ')
    case 'match':
      return exercise.pairs.map(([en, ko]) => `${en}=${ko}`).join(', ')
    default:
      return ''
  }
}
