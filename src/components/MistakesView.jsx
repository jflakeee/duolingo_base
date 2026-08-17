import { useMemo, useState } from 'react'
import { collectMistakes } from '../engine/mistakes.js'

// 오답노트: 전 과목 SRS 복습 큐를 읽기 좋게 보여주고, 과목별로 다시 풀기.
export default function MistakesView({ progress, onBack, onReviewSubject }) {
  const { total, dueTotal, groups } = useMemo(() => collectMistakes(progress, Date.now()), [progress])
  const [filter, setFilter] = useState('all') // 'all' | subjectId

  const shown = filter === 'all' ? groups : groups.filter((g) => g.subjectId === filter)

  return (
    <div className="mistakes">
      <div className="mistakes__top">
        <button className="iconbtn" onClick={onBack} aria-label="뒤로">←</button>
        <h1>📒 오답노트</h1>
      </div>

      {total === 0 ? (
        <div className="mistakes__empty">
          <div className="mistakes__empty-emoji">🎉</div>
          <p>틀린 문제가 없어요!</p>
          <p className="sub">레슨에서 틀린 문제가 여기 모여 복습할 수 있어요.</p>
        </div>
      ) : (
        <>
          <p className="mistakes__summary">
            모은 오답 <strong>{total}</strong>개 · 지금 복습할 문제 <strong>{dueTotal}</strong>개
          </p>

          <div className="mistakes__chips">
            <button className={`chip ${filter === 'all' ? 'chip--on' : ''}`} onClick={() => setFilter('all')}>전체 {total}</button>
            {groups.map((g) => (
              <button key={g.subjectId} className={`chip ${filter === g.subjectId ? 'chip--on' : ''}`}
                onClick={() => setFilter(g.subjectId)}>{g.icon} {g.name} {g.items.length}</button>
            ))}
          </div>

          {shown.map((g) => (
            <section key={g.subjectId} className="mistakes__group">
              <div className="mistakes__group-head">
                <h2>{g.icon} {g.name}</h2>
                <button className="btn btn--sm btn--blue" disabled={g.items.length === 0}
                  onClick={() => onReviewSubject(g.subjectId)}>
                  다시 풀기{g.dueCount > 0 && ` (${g.dueCount})`}
                </button>
              </div>
              <ul className="mistakes__list">
                {g.items.map((it) => (
                  <li key={it.key} className={`mistake ${it.due ? 'mistake--due' : ''}`}>
                    <div className="mistake__body">
                      <div className="mistake__prompt">{it.prompt || '(문제)'}</div>
                      <div className="mistake__answer">정답: {it.answerText}</div>
                    </div>
                    <span className={`mistake__badge box-${it.box}`}>{it.mastery}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
