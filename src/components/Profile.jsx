import Duck from './Duck.jsx'

function Stat({ k, v }) {
  return (
    <div className="pstat">
      <div className="pstat__v">{v}</div>
      <div className="pstat__k">{k}</div>
    </div>
  )
}

export default function Profile({ progress, onSetTheme, onSetGoal, onReset }) {
  return (
    <div className="tabscreen profile">
      <div className="profile__hero">
        <Duck mood="happy" size={80} bob />
        <div>
          <h1>내 학습</h1>
          <p className="lede">꾸준히 나아가고 있어요!</p>
        </div>
      </div>

      <div className="stat-grid">
        <Stat k="총 XP" v={progress.xp} />
        <Stat k="스트릭" v={`${progress.streak.count}일`} />
        <Stat k="완료 레슨" v={progress.completedLessons.length} />
        <Stat k="젬" v={progress.gems} />
      </div>

      <h2 className="section-title">설정</h2>
      <div className="setting-row">
        <span>테마</span>
        <div className="seg">
          {[['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(([t, label]) => (
            <button key={t} className={`seg__btn ${progress.settings.theme === t ? 'seg__btn--on' : ''}`}
              onClick={() => onSetTheme(t)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="setting-row">
        <span>하루 목표</span>
        <div className="seg">
          {[10, 20, 50, 100].map((g) => (
            <button key={g} className={`seg__btn ${progress.dailyGoal === g ? 'seg__btn--on' : ''}`}
              onClick={() => onSetGoal(g)}>{g}</button>
          ))}
        </div>
      </div>

      <button className="btn btn--ghost" style={{ marginTop: 18 }} onClick={onReset}>진도 초기화</button>
    </div>
  )
}
