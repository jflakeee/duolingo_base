import Duck from './Duck.jsx'

export default function Result({ summary, onContinue }) {
  const perfect = summary.mistakes === 0
  return (
    <div style={{ textAlign: 'center' }}>
      <Duck mood={perfect ? 'cheer' : 'happy'} size={120} />
      <h2>{perfect ? '완벽해요!' : '잘했어요!'}</h2>
      <p>정답 {summary.correct} / {summary.total} · 실수 {summary.mistakes}</p>
      <p>⭐ +{summary.xpGained} XP</p>
      <button className="btn" onClick={onContinue}>계속하기</button>
    </div>
  )
}
