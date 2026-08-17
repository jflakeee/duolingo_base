import { useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'

// 독해: 지문을 읽고 객관식 문항에 답한다. (국어·논술 공용)
export default function Reading({ exercise, onAnswer }) {
  const [picked, setPicked] = useState(null)
  return (
    <div>
      <div className="passage">{exercise.passage}</div>
      <h2>{exercise.prompt}</h2>
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
