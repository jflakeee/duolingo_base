import Duck from './Duck.jsx'

export default function Shop({ progress }) {
  return (
    <div className="tabscreen">
      <h1>상점 🛒</h1>
      <p className="lede">보유 젬: 💎 {progress.gems}</p>
      <div className="empty-card">
        <Duck mood="cheer" size={84} bob />
        <p><strong>상점이 준비 중이에요!</strong></p>
        <p className="lede">곧 하트 리필과 스트릭 프리즈를 살 수 있어요.</p>
      </div>
    </div>
  )
}
