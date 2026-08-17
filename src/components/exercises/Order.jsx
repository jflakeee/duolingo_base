import { useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'

// 배열형: 보기를 논리 순서대로 눌러 배열한다. 배열한 항목을 다시 누르면 취소.
export default function Order({ exercise, onAnswer }) {
  const bank = exercise.items.map((t, i) => ({ t, i }))
  const [chosen, setChosen] = useState([]) // [{t,i}] — 사용자가 배열한 순서
  const chosenIds = new Set(chosen.map((c) => c.i))
  const complete = chosen.length === bank.length

  return (
    <div>
      <h2>{exercise.prompt}</h2>
      <div className="order-slots">
        {chosen.map((c, n) => (
          <button key={c.i} className="order-slot" onClick={() => setChosen(chosen.filter((x) => x.i !== c.i))}>
            <span className="order-num">{n + 1}</span>{c.t}
          </button>
        ))}
      </div>
      <div className="order-bank">
        {bank.map((b) => (
          <button key={b.i} className="choice" disabled={chosenIds.has(b.i)}
            onClick={() => setChosen([...chosen, b])}>{b.t}</button>
        ))}
      </div>
      <div className="action-bar">
        <button className="btn" disabled={!complete}
          onClick={() => onAnswer(checkAnswer(exercise, chosen.map((c) => c.t)))}>확인</button>
      </div>
    </div>
  )
}
