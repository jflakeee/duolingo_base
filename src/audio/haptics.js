function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* ignore */
  }
}

export function buzzCorrect() { vibrate(15) }
export function buzzWrong() { vibrate([0, 40, 40, 40]) }
