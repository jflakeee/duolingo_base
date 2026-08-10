import { useMemo, useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak } from '../../audio/tts.js'

function shuffle(arr) {
  return [...arr].sort((a, b) => (a + a).localeCompare(b + b))
}

export default function WordBank({ exercise, onAnswer }) {
  const bank = useMemo(
    () => shuffle([...exercise.tokens, ...(exercise.distractors || [])]).map((t, i) => ({ t, i })),
    [exercise]
  )
  const [chosen, setChosen] = useState([]) // array of {t,i}
  const chosenIds = new Set(chosen.map((c) => c.i))

  return (
    <div>
      <h2>{exercise.prompt}</h2>
      {exercise.audioText && (
        <button className="audio-btn" onClick={() => speak(exercise.audioText)}>🔊 소리 듣기</button>
      )}
      <div className="tray">
        {chosen.map((c) => (
          <button key={c.i} className="token" onClick={() => setChosen(chosen.filter((x) => x.i !== c.i))}>{c.t}</button>
        ))}
      </div>
      <div>
        {bank.map((b) => (
          <button key={b.i} className="token" disabled={chosenIds.has(b.i)}
            onClick={() => setChosen([...chosen, b])}>{b.t}</button>
        ))}
      </div>
      <div className="action-bar">
        <button className="btn" disabled={chosen.length === 0}
          onClick={() => onAnswer(checkAnswer(exercise, chosen.map((c) => c.t)))}>확인</button>
      </div>
    </div>
  )
}
