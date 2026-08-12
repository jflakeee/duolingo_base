import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { encodeProgress, decodeProgress } from '../engine/transfer.js'

// 회원번호 표시 + 진도 이관 QR/코드 + 코드로 가져오기.
export default function ShareCard({ progress, lessonIds, onImport }) {
  const code = encodeProgress(progress, lessonIds)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [msg, setMsg] = useState(null) // { ok, text }

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(code, { margin: 1, width: 200 }).then((url) => { if (alive) setQr(url) }).catch(() => {})
    return () => { alive = false }
  }, [code])

  function copy() {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }
  function doImport() {
    const patch = decodeProgress(importText, lessonIds)
    if (!patch) { setMsg({ ok: false, text: '코드를 확인해 주세요.' }); return }
    onImport(patch)
    setMsg({ ok: true, text: '진도를 가져왔어요!' })
    setShowImport(false); setImportText('')
  }

  return (
    <div className="share-card">
      <div className="share-id">
        <span className="share-id__label">회원번호</span>
        <span className="share-id__val">{progress.memberId || '—'}</span>
      </div>
      {qr && <img className="share-qr" src={qr} alt="계정 공유 QR" width={200} height={200} />}
      <p className="share-hint">다른 기기에서 QR을 스캔하거나 코드를 붙여넣어 진도를 옮겨요.</p>
      <div className="share-actions">
        <button className="btn btn--sm btn--ghost" onClick={copy}>{copied ? '복사됨 ✓' : '코드 복사'}</button>
        <button className="btn btn--sm btn--ghost" onClick={() => { setShowImport((v) => !v); setMsg(null) }}>코드로 가져오기</button>
      </div>
      {showImport && (
        <div className="share-import">
          <textarea className="typein" rows={3} value={importText} placeholder="LDX1:... 코드를 붙여넣으세요"
            onChange={(e) => setImportText(e.target.value)} aria-label="가져올 코드" />
          <button className="btn btn--sm" disabled={!importText.trim()} onClick={doImport}>가져오기</button>
        </div>
      )}
      {msg && <p className={`share-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}
    </div>
  )
}
