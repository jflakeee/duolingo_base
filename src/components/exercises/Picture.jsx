import { useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak } from '../../audio/tts.js'

export default function Picture({ exercise, onAnswer }) {
  const [picked, setPicked] = useState(null)
  return (
    <div>
      <h2>{exercise.prompt}</h2>
      {exercise.word && (
        <button className="audio-btn" onClick={() => speak(exercise.audioText ?? exercise.word, exercise.lang)}>
          🔊 {exercise.word}
        </button>
      )}
      <div className="pic-grid">
        {exercise.choices.map((c) => (
          <button
            key={c}
            className={`pic-card ${picked === c ? 'selected' : ''}`}
            onClick={() => setPicked(c)}
            aria-label={c}
          >
            <span className="pic-emoji">{c}</span>
          </button>
        ))}
      </div>
      <div className="action-bar">
        <button className="btn" disabled={picked === null}
          onClick={() => onAnswer(checkAnswer(exercise, picked))}>확인</button>
      </div>
    </div>
  )
}
