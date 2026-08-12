import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { classroomSummary, sortStudents } from '../engine/classroom.js'
import { encodeMessage, MAX_LEN } from '../engine/messages.js'

// 선생님: 여러 학생 진도를 학급 요약 + 정렬 로스터로 한눈에 + 응원 메시지 코드 생성.
export default function ClassOverview({ students, onAddChild, onRemoveChild, myMemberId }) {
  const [by, setBy] = useState('pct')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const list = students || []
  const sum = classroomSummary(list)
  const rows = sortStudents(list, by)

  // 응원 메시지 작성
  const [text, setText] = useState('')
  const [to, setTo] = useState('')
  const [msgCode, setMsgCode] = useState('')
  const [msgQr, setMsgQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!msgCode) { setMsgQr(''); return }
    let alive = true
    QRCode.toDataURL(msgCode, { margin: 1, width: 180 }).then((u) => { if (alive) setMsgQr(u) }).catch(() => {})
    return () => { alive = false }
  }, [msgCode])

  function add() {
    const res = onAddChild(code)
    setMsg({ ok: res.ok, text: res.message })
    if (res.ok) setCode('')
  }
  function makeMessage() {
    if (!text.trim()) return
    setMsgCode(encodeMessage({ from: myMemberId || '', to, text: text.trim() }))
    setCopied(false)
  }
  function copyMsg() {
    navigator.clipboard?.writeText(msgCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
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

      <div className="msg-compose">
        <div className="msg-compose__title">💌 응원 메시지 보내기</div>
        {list.length > 0 && (
          <select className="msg-to" value={to} onChange={(e) => setTo(e.target.value)} aria-label="받는 학생">
            <option value="">받는 학생 (전체)</option>
            {list.map((s) => <option key={s.memberId} value={s.memberId}>{s.memberId}</option>)}
          </select>
        )}
        <textarea className="typein" rows={2} maxLength={MAX_LEN} value={text} placeholder="응원 메시지를 입력하세요 (최대 120자)"
          onChange={(e) => setText(e.target.value)} aria-label="응원 메시지" />
        <button className="btn btn--sm btn--gold" disabled={!text.trim()} onClick={makeMessage}>응원 코드 만들기</button>
        {msgCode && (
          <div className="gift-made">
            <p className="gift-hint">받는 학생이 "코드로 가져오기"에 붙여넣으면 응원이 도착해요.</p>
            {msgQr && <img className="share-qr" src={msgQr} alt="응원 QR" width={180} height={180} />}
            <div className="share-actions">
              <button className="btn btn--sm btn--ghost" onClick={copyMsg}>{copied ? '복사됨 ✓' : '응원 코드 복사'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
