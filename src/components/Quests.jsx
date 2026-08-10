import Duck from './Duck.jsx'

export default function Quests() {
  return (
    <div className="tabscreen">
      <h1>일일 퀘스트 🎯</h1>
      <div className="empty-card">
        <Duck mood="happy" size={84} bob />
        <p><strong>퀘스트가 곧 찾아와요!</strong></p>
        <p className="lede">매일 목표를 달성하고 젬을 모으게 될 거예요.</p>
      </div>
    </div>
  )
}
