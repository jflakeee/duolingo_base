// Immutable-ish session state. Each call returns a new state object.
export function createSession(exercises) {
  return {
    queue: exercises.map((ex, i) => ({ ex, id: i })),
    total: exercises.length,
    completed: 0,   // distinct exercises answered correctly
    correct: 0,     // same as completed at end; kept for clarity
    mistakes: 0,
    done: exercises.length === 0,
  }
}

export function currentExercise(session) {
  return session.queue[0]?.ex ?? null
}

export function answer(session, isCorrect) {
  const [head, ...rest] = session.queue
  if (!head) return { ...session, done: true }

  let queue, completed, correct, mistakes
  if (isCorrect) {
    queue = rest
    completed = session.completed + 1
    correct = session.correct + 1
    mistakes = session.mistakes
  } else {
    queue = [...rest, head] // requeue to end
    completed = session.completed
    correct = session.correct
    mistakes = session.mistakes + 1
  }
  return { ...session, queue, completed, correct, mistakes, done: queue.length === 0 }
}
