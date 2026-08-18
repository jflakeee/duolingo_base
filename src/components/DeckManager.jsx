import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { parseDeck } from '../engine/deckParser.js'
import { encodeDeck, MAX_SHARE_EXERCISES } from '../engine/deckShare.js'

const EXAMPLE = `사과는 영어로? | apple
가장 큰 행성은? | 목성 | 지구 | 화성 | 금성
유비무환의 뜻은? | 미리 준비함`

// 내 문제집 관리: 붙여넣기로 덱 생성 · 목록(이름변경/삭제/공유) · 코드로 가져오기.
export default function DeckManager({ decks = [], onCreateDeck, onRenameDeck, onDeleteDeck, onImportCode, onBack }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [shareId, setShareId] = useState(null) // 공유 펼친 덱 id
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importMsg, setImportMsg] = useState(null)

  const parsed = parseDeck(text)
  const shareDeck = decks.find((d) => d.id === shareId)
  const shareCode = shareDeck ? encodeDeck(shareDeck) : ''

  useEffect(() => {
    let alive = true
    if (!shareCode) { setQr(''); return }
    QRCode.toDataURL(shareCode, { margin: 1, width: 200 }).then((u) => { if (alive) setQr(u) }).catch(() => {})
    return () => { alive = false }
  }, [shareCode])

  function create() {
    if (!name.trim() || parsed.exercises.length === 0) return
    onCreateDeck(name.trim(), parsed.exercises)
    setName(''); setText('')
  }
  function rename(deck) {
    const next = window.prompt('문제집 이름', deck.name)
    if (next && next.trim()) onRenameDeck(deck.id, next.trim())
  }
  function remove(deck) {
    if (window.confirm(`"${deck.name}" 문제집을 삭제할까요?`)) {
      if (shareId === deck.id) setShareId(null)
      onDeleteDeck(deck.id)
    }
  }
  function copy() {
    navigator.clipboard?.writeText(shareCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }
  function doImport() {
    const res = onImportCode(importText)
    setImportMsg({ ok: res.ok, text: res.message })
    if (res.ok) { setImportOpen(false); setImportText('') }
  }

  return (
    <div className="deckmgr">
      <div className="mistakes__top">
        <button className="iconbtn" onClick={onBack} aria-label="뒤로">←</button>
        <h1>📓 내 문제집</h1>
      </div>

      <section className="deckmgr__create">
        <h2>새 문제집 만들기</h2>
        <input className="typein" value={name} placeholder="문제집 이름 (예: 3단원 영단어)"
          onChange={(e) => setName(e.target.value)} aria-label="문제집 이름" />
        <textarea className="typein deckmgr__paste" rows={6} value={text}
          placeholder={`한 줄에 한 문제씩 붙여넣으세요.\n\n${EXAMPLE}`}
          onChange={(e) => setText(e.target.value)} aria-label="문제 붙여넣기" />
        <p className="deckmgr__hint">
          형식: <code>질문 | 정답</code> = 주관식, <code>질문 | 정답 | 오답 | 오답</code> = 객관식 (첫 번째가 정답)
        </p>
        {text.trim() && (
          <p className="deckmgr__preview">
            문제 <strong>{parsed.exercises.length}</strong>개 인식됨
            {parsed.errors.length > 0 && <span className="deckmgr__errcount"> · 오류 {parsed.errors.length}줄</span>}
          </p>
        )}
        {parsed.errors.length > 0 && (
          <ul className="deckmgr__errors">
            {parsed.errors.slice(0, 5).map((e) => (
              <li key={e.line}>{e.line}번째 줄: {e.reason}</li>
            ))}
          </ul>
        )}
        <button className="btn btn--blue" disabled={!name.trim() || parsed.exercises.length === 0} onClick={create}>
          문제집 만들기
        </button>
      </section>

      <section className="deckmgr__import">
        <button className="btn btn--sm btn--ghost" onClick={() => { setImportOpen((v) => !v); setImportMsg(null) }}>
          📥 공유받은 문제집 가져오기
        </button>
        {importOpen && (
          <div className="share-import">
            <textarea className="typein" rows={3} value={importText} placeholder="LDD1:... 코드를 붙여넣으세요"
              onChange={(e) => setImportText(e.target.value)} aria-label="가져올 코드" />
            <button className="btn btn--sm" disabled={!importText.trim()} onClick={doImport}>가져오기</button>
          </div>
        )}
        {importMsg && <p className={`share-msg ${importMsg.ok ? 'ok' : 'err'}`}>{importMsg.text}</p>}
      </section>

      <section className="deckmgr__list">
        <h2>내 문제집 {decks.length}개</h2>
        {decks.length === 0 && <p className="deckmgr__empty">아직 문제집이 없어요. 위에서 붙여넣어 만들어 보세요!</p>}
        {decks.map((deck) => (
          <div key={deck.id} className="deckmgr__item">
            <div className="deckmgr__item-head">
              <div>
                <div className="deckmgr__item-name">📘 {deck.name}</div>
                <div className="deckmgr__item-sub">{deck.exercises.length}문제</div>
              </div>
              <div className="deckmgr__item-actions">
                <button className="btn btn--sm btn--ghost" onClick={() => rename(deck)}>이름</button>
                <button className="btn btn--sm btn--ghost" onClick={() => setShareId(shareId === deck.id ? null : deck.id)}>공유</button>
                <button className="btn btn--sm btn--ghost deckmgr__del" onClick={() => remove(deck)}>삭제</button>
              </div>
            </div>
            {shareId === deck.id && (
              <div className="deckmgr__share">
                {deck.exercises.length > MAX_SHARE_EXERCISES && (
                  <p className="deckmgr__warn">⚠️ 문제가 많아 처음 {MAX_SHARE_EXERCISES}개만 공유돼요.</p>
                )}
                {qr && <img className="share-qr" src={qr} alt="문제집 공유 QR" width={200} height={200} />}
                <button className="btn btn--sm btn--ghost" onClick={copy}>{copied ? '복사됨 ✓' : '코드 복사'}</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
