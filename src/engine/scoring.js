export function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

// Forgiving comparison for typed answers: trim, lowercase, drop trailing
// sentence punctuation, and collapse inner whitespace.
export function normalizeText(s) {
  return (s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/, '')
    .replace(/\s+/g, ' ')
}

// response shape by type:
//   mcq/picture -> string
//   typein/dictation -> string (free text)
//   wordbank/listen -> string[] (ordered)
//   match   -> { [english]: koreanUserPicked }
export function checkAnswer(exercise, response) {
  switch (exercise.type) {
    case 'picture':
      return response === exercise.answer
    case 'mcq':
      return response === exercise.answer
    case 'typein':
    case 'dictation': {
      const target = normalizeText(response)
      return [exercise.answer, ...(exercise.accept ?? [])].some((a) => normalizeText(a) === target)
    }
    case 'wordbank':
    case 'listen':
      return arraysEqual(response, exercise.answer)
    case 'match':
      return exercise.pairs.every(([en, ko]) => response?.[en] === ko)
    default:
      return false
  }
}
