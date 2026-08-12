import { useState } from 'react'

// 부모/선생: 자녀·학생의 공유 코드를 등록해 진도(스냅샷)를 확인. 실시간 아님(재등록으로 갱신).
export default function ChildrenPanel({ children, onAddChild, onRemoveChild }) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const list = children || []

  function add() {
    const res = onAddChild(code)
    setMsg({ ok: res.ok, text: res.message })
    if (res.ok) setCode('')
  }

  return (
    <div className="children-panel">
      {list.length === 0 && <p className="gift-hint">자녀의 회원 코드를 붙여넣어 진도를 확인해요.</p>}
      {list.map((c) => (
        <div key={c.memberId} className="child-card">
          <div className="child-card__head">
            <span className="child-card__id">{c.memberId || '—'}</span>
            <button className="child-card__x" aria-label="자녀 삭제" onClick={() => onRemoveChild(c.memberId)}>✕</button>
          </div>
          <div className="child-card__stats">
            <span>⭐ {c.xp} XP</span>
            <span>🔥 {c.streakCount}일</span>
            <span>✅ {c.completed}/{c.total}</span>
          </div>
          <div className="progress child-card__bar"><i style={{ width: `${c.pct}%` }} /></div>
        </div>
      ))}
      <div className="share-import">
        <textarea className="typein" rows={2} value={code} placeholder="자녀의 LDX1:... 코드를 붙여넣으세요"
          onChange={(e) => setCode(e.target.value)} aria-label="자녀 코드" />
        <button className="btn btn--sm" disabled={!code.trim()} onClick={add}>자녀 추가</button>
      </div>
      {msg && <p className={`share-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}
    </div>
  )
}
