import { useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak } from '../../audio/tts.js'

export default function Mcq({ exercise, onAnswer }) {
  const [picked, setPicked] = useState(null)
  return (
    <div>
      <h2>{exercise.prompt}</h2>
      {exercise.audioText && (
        <button className="audio-btn" onClick={() => speak(exercise.audioText, exercise.lang)}>🔊 소리 듣기</button>
      )}
      {exercise.choices.map((c) => (
        <button
          key={c}
          className={`choice ${picked === c ? 'selected' : ''}`}
          onClick={() => setPicked(c)}
        >
          {c}
        </button>
      ))}
      <div className="action-bar">
        <button className="btn" disabled={picked === null}
          onClick={() => onAnswer(checkAnswer(exercise, picked))}>확인</button>
      </div>
    </div>
  )
}
