import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { GIFT_ITEMS, encodeGift } from '../engine/gifting.js'

// 부모/선생/운영자: 젬으로 선물을 만들어 코드/QR로 전달. 실제 돈 아님(인앱 젬).
export default function GiftPanel({ gems, onSpendGems }) {
  const [gift, setGift] = useState(null) // { id, code }
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!gift) { setQr(''); return }
    let alive = true
    QRCode.toDataURL(gift.code, { margin: 1, width: 180 }).then((u) => { if (alive) setQr(u) }).catch(() => {})
    return () => { alive = false }
  }, [gift])

  function make(item) {
    if (gems < item.cost) return
    onSpendGems(-item.cost)
    setGift({ id: item.id, code: encodeGift({ id: item.id }) })
    setCopied(false)
  }
  function copy() {
    navigator.clipboard?.writeText(gift.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <div className="gift-panel">
      <p className="gift-hint">💎 {gems} · 젬으로 선물을 만들어 자녀/학생에게 코드로 보내요.</p>
      <div className="gift-items">
        {GIFT_ITEMS.map((it) => (
          <button key={it.id} className="gift-item" disabled={gems < it.cost} onClick={() => make(it)}>
            <span className="gift-item__ico">{it.icon}</span>
            <span className="gift-item__label">{it.label}</span>
            <span className="gift-item__cost">💎 {it.cost}</span>
          </button>
        ))}
      </div>
      {gift && (
        <div className="gift-made">
          <p className="gift-hint">선물 코드가 만들어졌어요. 받는 사람이 "코드로 가져오기"에 붙여넣으면 돼요.</p>
          {qr && <img className="share-qr" src={qr} alt="선물 QR" width={180} height={180} />}
          <div className="share-actions">
            <button className="btn btn--sm btn--ghost" onClick={copy}>{copied ? '복사됨 ✓' : '선물 코드 복사'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
