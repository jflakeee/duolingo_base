import { useEffect } from 'react'
import Duck from './Duck.jsx'
import { playComplete } from '../audio/sfx.js'

const CONFETTI_COLORS = ['#58cc02', '#ffc800', '#1cb0f6', '#ce82ff', '#ff4b4b', '#ff9600']

function Confetti({ count = 26 }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = Math.round((i / count) * 100 + (Math.random() * 6 - 3))
    const dur = 2.4 + Math.random() * 1.8
    const delay = Math.random() * 0.8
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    const rot = Math.round(Math.random() * 60 - 30)
    return (
      <i
        key={i}
        style={{
          left: `${left}%`,
          background: color,
          width: `${7 + Math.round(Math.random() * 6)}px`,
          height: `${10 + Math.round(Math.random() * 8)}px`,
          borderRadius: i % 3 === 0 ? '50%' : '2px',
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          transform: `rotate(${rot}deg)`,
        }}
      />
    )
  })
  return <div className="confetti">{pieces}</div>
}

export default function Result({ summary, streak, onContinue }) {
  const perfect = summary.mistakes === 0
  const accuracy = Math.round((summary.correct / summary.total) * 100)
  useEffect(() => { playComplete() }, [])
  return (
    <div className="result">
      {perfect && <Confetti />}
      <Duck mood={perfect ? 'cheer' : 'happy'} size={128} bob animate="cheer" />
      <h2>{perfect ? '완벽해요! 🎉' : '잘했어요! 👏'}</h2>
      <p className="lede">
        {perfect ? '실수 없이 통과했어요' : `정답 ${summary.correct} / ${summary.total} · 실수 ${summary.mistakes}`}
      </p>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card__inner">
            <div className="k">획득 XP</div>
            <div className="v">+{summary.xpGained}</div>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-card__inner">
            <div className="k">정답률</div>
            <div className="v">{accuracy}%</div>
          </div>
        </div>
      </div>

      {streak > 0 && <p className="streak-line">🔥 {streak}일 연속 학습 중!</p>}
      <button className="btn" onClick={onContinue}>계속하기</button>
    </div>
  )
}
