import { useMemo, useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'

function shuffle(arr) {
  return [...arr].sort((a, b) => (a + a).localeCompare(b + b))
}

export default function Match({ exercise, onAnswer }) {
  const lefts = exercise.pairs.map(([en]) => en)
  const rights = useMemo(() => shuffle(exercise.pairs.map(([, ko]) => ko)), [exercise])
  const [selEn, setSelEn] = useState(null)
  const [map, setMap] = useState({}) // { english: koreanChosen }

  function pickKo(ko) {
    if (!selEn) return
    setMap({ ...map, [selEn]: ko })
    setSelEn(null)
  }

  const complete = lefts.every((en) => map[en] != null)

  return (
    <div>
      <h2>{exercise.prompt}</h2>
      <div className="match-grid">
        <div className="match-col">
          {lefts.map((en) => (
            <button key={en}
              className={`choice ${selEn === en ? 'selected' : ''} ${map[en] ? 'correct' : ''}`}
              onClick={() => setSelEn(en)}>
              {en}{map[en] ? ` → ${map[en]}` : ''}
            </button>
          ))}
        </div>
        <div className="match-col">
          {rights.map((ko) => {
            const used = Object.values(map).includes(ko)
            return (
              <button key={ko} className="choice" disabled={used} onClick={() => pickKo(ko)}>{ko}</button>
            )
          })}
        </div>
      </div>
      <div className="action-bar">
        <button className="btn" disabled={!complete}
          onClick={() => onAnswer(checkAnswer(exercise, map))}>확인</button>
      </div>
    </div>
  )
}
