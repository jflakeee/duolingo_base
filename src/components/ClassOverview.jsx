import { useState } from 'react'
import { classroomSummary, sortStudents } from '../engine/classroom.js'

// 선생님: 여러 학생 진도를 학급 요약 + 정렬 가능한 컴팩트 로스터로 한눈에.
export default function ClassOverview({ students, onAddChild, onRemoveChild }) {
  const [by, setBy] = useState('pct')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const list = students || []
  const sum = classroomSummary(list)
  const rows = sortStudents(list, by)

  function add() {
    const res = onAddChild(code)
    setMsg({ ok: res.ok, text: res.message })
    if (res.ok) setCode('')
  }

  return (
    <div className="class-overview">
      <div className="class-summary">
        <div className="class-tile"><b>{sum.count}</b><span>학생</span></div>
        <div className="class-tile"><b>{sum.avgPct}%</b><span>평균 진행률</span></div>
        <div className="class-tile"><b>{sum.avgXp}</b><span>평균 XP</span></div>
      </div>

      {list.length > 0 && (
        <div className="class-sort seg">
          {[['pct', '진행률'], ['xp', 'XP'], ['streak', '스트릭']].map(([k, l]) => (
            <button key={k} className={`seg__btn ${by === k ? 'seg__btn--on' : ''}`} onClick={() => setBy(k)}>{l}순</button>
          ))}
        </div>
      )}

      <div className="class-roster">
        {rows.map((s) => (
          <div key={s.memberId} className="student-row">
            <span className="student-row__id">{s.memberId || '—'}</span>
            <div className="progress student-row__bar"><i style={{ width: `${s.pct}%` }} /></div>
            <span className="student-row__pct">{s.pct}%</span>
            <span className="student-row__xp">⭐{s.xp}</span>
            <button className="child-card__x" aria-label="학생 삭제" onClick={() => onRemoveChild(s.memberId)}>✕</button>
          </div>
        ))}
      </div>

      <div className="share-import">
        <textarea className="typein" rows={2} value={code} placeholder="학생의 LDX1:... 코드를 붙여넣으세요"
          onChange={(e) => setCode(e.target.value)} aria-label="학생 코드" />
        <button className="btn btn--sm" disabled={!code.trim()} onClick={add}>학생 추가</button>
      </div>
      {msg && <p className={`share-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}
    </div>
  )
}
