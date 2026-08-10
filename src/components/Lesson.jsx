import { useState } from 'react'
import { createSession, currentExercise, answer } from '../engine/session.js'
import { xpForLesson } from '../engine/gamification.js'
import { correctAnswerText } from '../engine/answerText.js'
import { playCorrect, playWrong } from '../audio/sfx.js'
import Mcq from './exercises/Mcq.jsx'
import WordBank from './exercises/WordBank.jsx'
import Listen from './exercises/Listen.jsx'
import Match from './exercises/Match.jsx'

const REGISTRY = { mcq: Mcq, wordbank: WordBank, listen: Listen, match: Match }

export default function Lesson({ lesson, onWrong, onFinish, onQuit }) {
  const [session, setSession] = useState(() => createSession(lesson.exercises))
  const [combo, setCombo] = useState(0)
  // sheet: null | { correct: boolean, answerText: string, combo: number }
  const [sheet, setSheet] = useState(null)

  const ex = currentExercise(session)
  const pct = Math.round((session.completed / session.total) * 100)

  function handleAnswer(isCorrect) {
    const nextCombo = isCorrect ? combo + 1 : 0
    if (isCorrect) { playCorrect() } else { playWrong(); onWrong?.() }
    setCombo(nextCombo)
    setSheet({ correct: isCorrect, answerText: correctAnswerText(ex), combo: nextCombo })
  }

  function handleContinue() {
    const wasCorrect = sheet.correct
    setSheet(null)
    const next = answer(session, wasCorrect)
    setSession(next)
    if (next.done) {
      const xpGained = xpForLesson({ correct: next.correct, total: next.total, mistakes: next.mistakes })
      onFinish({ correct: next.correct, total: next.total, mistakes: next.mistakes, xpGained })
    }
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

      {sheet && (
        <div className={`sheet sheet--${sheet.correct ? 'correct' : 'wrong'}`}>
          <div className="sheet__msg">
            <span className="sheet__badge">{sheet.correct ? '🎉' : '💡'}</span>
            <div>
              <strong>{sheet.correct ? '정답이에요!' : '아쉬워요'}</strong>
              {sheet.correct && sheet.combo >= 2 && <span className="combo">🔥 콤보 x{sheet.combo}</span>}
              {!sheet.correct && <div className="sheet__answer">정답: {sheet.answerText}</div>}
            </div>
          </div>
          <button className="btn" onClick={handleContinue}>계속</button>
        </div>
      )}
    </div>
  )
}
