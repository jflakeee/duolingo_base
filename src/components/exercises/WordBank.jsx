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
        <button className="btn-ghost choice" onClick={() => speak(exercise.audioText)}>🔊 듣기</button>
      )}
      <div className="progress" style={{ minHeight: 48, background: '#fff', border: '2px solid #e5e5e5', padding: 6 }}>
        {chosen.map((c) => (
          <button key={c.i} className="token" onClick={() => setChosen(chosen.filter((x) => x.i !== c.i))}>{c.t}</button>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        {bank.map((b) => (
          <button key={b.i} className="token" disabled={chosenIds.has(b.i)}
            onClick={() => setChosen([...chosen, b])}>{b.t}</button>
        ))}
      </div>
      <button className="btn" disabled={chosen.length === 0}
        onClick={() => onAnswer(checkAnswer(exercise, chosen.map((c) => c.t)))}>확인</button>
    </div>
  )
}
