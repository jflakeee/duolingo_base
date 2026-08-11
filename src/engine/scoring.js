export function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

// response shape by type:
//   mcq     -> string
//   wordbank/listen -> string[] (ordered)
//   match   -> { [english]: koreanUserPicked }
export function checkAnswer(exercise, response) {
  switch (exercise.type) {
    case 'picture':
      return response === exercise.answer
    case 'mcq':
      return response === exercise.answer
    case 'wordbank':
    case 'listen':
      return arraysEqual(response, exercise.answer)
    case 'match':
      return exercise.pairs.every(([en, ko]) => response?.[en] === ko)
    default:
      return false
  }
}
