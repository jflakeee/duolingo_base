import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { encodeMessage, MAX_LEN } from '../engine/messages.js'

// 받은 응원 1건 + 답장 작성기(원 발신자를 수신자로). 답장도 LDM1 메시지 코드로 핸드오프.
export default function MessageCard({ msg, myMemberId }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [code, setCode] = useState('')
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!code) { setQr(''); return }
    let alive = true
    QRCode.toDataURL(code, { margin: 1, width: 160 }).then((u) => { if (alive) setQr(u) }).catch(() => {})
    return () => { alive = false }
  }, [code])

  function makeReply() {
    if (!text.trim()) return
    setCode(encodeMessage({ from: myMemberId || '', to: msg.from || '', text: text.trim() }))
    setCopied(false)
  }
  function copy() {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <div className="inbox-msg">
      <div className="inbox-msg__text">{msg.text}</div>
      {msg.from && <div className="inbox-msg__from">— {msg.from}</div>}
      {msg.from && (
        <button className="btn btn--sm btn--ghost inbox-msg__reply" onClick={() => setOpen((v) => !v)}>
          {open ? '닫기' : '답장'}
        </button>
      )}
      {open && (
        <div className="reply-box">
          <textarea className="typein" rows={2} maxLength={MAX_LEN} value={text}
            placeholder="답장을 입력하세요 (최대 120자)" aria-label="답장 메시지"
            onChange={(e) => setText(e.target.value)} />
          <button className="btn btn--sm btn--gold" disabled={!text.trim()} onClick={makeReply}>답장 코드 만들기</button>
          {code && (
            <div className="gift-made">
              <p className="gift-hint">선생님이 "코드로 가져오기"에 붙여넣으면 답장이 도착해요.</p>
              {qr && <img className="share-qr" src={qr} alt="답장 QR" width={160} height={160} />}
              <div className="share-actions">
                <button className="btn btn--sm btn--ghost" onClick={copy}>{copied ? '복사됨 ✓' : '답장 코드 복사'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
