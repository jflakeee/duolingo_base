import { useState } from 'react'
import { createSession, currentExercise, answer } from '../engine/session.js'
import { xpForLesson } from '../engine/gamification.js'
import { playCorrect, playWrong } from '../audio/sfx.js'
import Mcq from './exercises/Mcq.jsx'
import WordBank from './exercises/WordBank.jsx'
import Listen from './exercises/Listen.jsx'
import Match from './exercises/Match.jsx'

const REGISTRY = { mcq: Mcq, wordbank: WordBank, listen: Listen, match: Match }

export default function Lesson({ lesson, onWrong, onFinish, onQuit }) {
  const [session, setSession] = useState(() => createSession(lesson.exercises))
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong' | null

  const ex = currentExercise(session)
  const pct = Math.round((session.completed / session.total) * 100)

  function handleAnswer(isCorrect) {
    if (isCorrect) { playCorrect() } else { playWrong(); onWrong?.() }
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      setFeedback(null)
      const next = answer(session, isCorrect)
      setSession(next)
      if (next.done) {
        const xpGained = xpForLesson({ correct: next.correct, total: next.total, mistakes: next.mistakes })
        onFinish({ correct: next.correct, total: next.total, mistakes: next.mistakes, xpGained })
      }
    }, 550)
  }

  if (!ex) return null
  const ExComp = REGISTRY[ex.type]

  return (
    <div>
      <div className="lesson-top">
        <button className="iconbtn" onClick={onQuit} aria-label="레슨 나가기">✕</button>
        <div className="progress" style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="ex" key={session.queue[0].id}>
        <ExComp exercise={ex} onAnswer={handleAnswer} />
      </div>
      {feedback && (
        <div className={`feedback feedback--${feedback}`}>
          <span className="badge">{feedback === 'correct' ? '🎉' : '💡'}</span>
          {feedback === 'correct' ? '정답이에요!' : '아쉬워요, 이 문제는 다시 나올 거예요.'}
        </div>
      )}
    </div>
  )
}
