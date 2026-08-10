export default function Quests({ progress, onClaim }) {
  const items = progress.quests?.items ?? []
  return (
    <div className="tabscreen">
      <h1>일일 퀘스트 🎯</h1>
      <p className="lede">자정에 새로 시작돼요.</p>
      {items.map((q) => {
        const pct = Math.min(100, Math.round((q.progress / q.target) * 100))
        const done = q.progress >= q.target
        return (
          <div key={q.id} className="quest">
            <div className="quest__top">
              <span>{q.label}</span>
              <span className="quest__reward">💎 {q.reward}</span>
            </div>
            <div className="progress"><i style={{ width: `${pct}%` }} /></div>
            <div className="quest__foot">
              <span className="quest__count">{q.progress}/{q.target}</span>
              <button className="btn btn--sm btn--gold" disabled={!done || q.claimed} onClick={() => onClaim(q.id)}>
                {q.claimed ? '받음 ✓' : '받기'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
