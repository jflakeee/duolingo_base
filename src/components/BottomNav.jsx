const TABS = [
  { id: 'learn', label: '학습', icon: '🏠' },
  { id: 'quests', label: '퀘스트', icon: '🎯' },
  { id: 'shop', label: '상점', icon: '🛒' },
  { id: 'profile', label: '프로필', icon: '👤' },
]

export default function BottomNav({ tab, onTab }) {
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`navbtn ${tab === t.id ? 'navbtn--active' : ''}`}
          onClick={() => onTab(t.id)}
        >
          <span className="navbtn__ico">{t.icon}</span>
          <span className="navbtn__label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
