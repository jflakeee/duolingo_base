import { useState } from 'react'
import Duck from './Duck.jsx'

const GOALS = [
  { xp: 10, label: '가볍게' },
  { xp: 20, label: '보통' },
  { xp: 50, label: '진지하게' },
  { xp: 100, label: '최대로' },
]
const LEVELS = [
  { id: 'kinder', label: '유치원', desc: '처음 시작해요' },
  { id: 'grade1', label: '초등 1학년', desc: '기초는 알아요' },
  { id: 'grade2', label: '초등 2학년', desc: '문장도 만들 수 있어요' },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(50)

  return (
    <div className="app onboarding">
      {step === 0 && (
        <div className="ob-step">
          <Duck mood="cheer" size={150} bob animate="cheer" />
          <h1>안녕! 나는 덕이 🦆</h1>
          <p className="lede">매일 조금씩, 영어가 즐거워져요.</p>
          <button className="btn" onClick={() => setStep(1)}>시작하기</button>
        </div>
      )}
      {step === 1 && (
        <div className="ob-step">
          <h1>하루 목표를 골라요</h1>
          <p className="lede">언제든 프로필에서 바꿀 수 있어요.</p>
          {GOALS.map((g) => (
            <button key={g.xp} className={`choice ${goal === g.xp ? 'selected' : ''}`} onClick={() => setGoal(g.xp)}>
              {g.label} · 하루 {g.xp} XP
            </button>
          ))}
          <div className="action-bar"><button className="btn" onClick={() => setStep(2)}>다음</button></div>
        </div>
      )}
      {step === 2 && (
        <div className="ob-step">
          <h1>어디서 시작할까요?</h1>
          <p className="lede">고른 단계 이전은 완료 처리되어 열려요.</p>
          {LEVELS.map((l) => (
            <button key={l.id} className="choice" onClick={() => onDone({ dailyGoal: goal, startLevel: l.id })}>
              <strong>{l.label}</strong> — {l.desc}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
