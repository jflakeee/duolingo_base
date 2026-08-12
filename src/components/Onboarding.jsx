import { useState } from 'react'
import Duck from './Duck.jsx'
import { getLevels } from '../data/loadCurriculum.js'
import { BUILD_TIME, formatBuildTime } from '../buildInfo.js'

const GOALS = [
  { xp: 10, label: '가볍게' },
  { xp: 20, label: '보통' },
  { xp: 50, label: '진지하게' },
  { xp: 100, label: '최대로' },
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
          {getLevels().map((l) => (
            <button key={l.id} className="choice" onClick={() => onDone({ dailyGoal: goal, startLevel: l.id })}>
              <strong>{l.name}</strong>
            </button>
          ))}
        </div>
      )}
      {BUILD_TIME && <p className="landing-foot">최근 업데이트: {formatBuildTime()}</p>}
    </div>
  )
}
