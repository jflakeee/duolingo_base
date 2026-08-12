import Duck from './Duck.jsx'
import InstallButton from './InstallButton.jsx'
import ShareCard from './ShareCard.jsx'
import { ACHIEVEMENTS } from '../engine/achievements.js'
import { BUILD_TIME, formatBuildTime } from '../buildInfo.js'

function Stat({ k, v }) {
  return (
    <div className="pstat">
      <div className="pstat__v">{v}</div>
      <div className="pstat__k">{k}</div>
    </div>
  )
}

export default function Profile({ progress, onSetTheme, onSetGoal, onReset, lessonIds, onImport }) {
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

      <h2 className="section-title">업적</h2>
      <div className="badges">
        {ACHIEVEMENTS.map((a) => {
          const on = !!progress.achievements?.[a.id]
          return (
            <div key={a.id} className={`badge-card ${on ? '' : 'badge-card--locked'}`}>
              <div className="badge-card__ico">{on ? a.icon : '🔒'}</div>
              <div className="badge-card__label">{a.label}</div>
            </div>
          )
        })}
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

      <h2 className="section-title">계정 공유</h2>
      <ShareCard progress={progress} lessonIds={lessonIds} onImport={onImport} />

      <InstallButton />
      <button className="btn btn--ghost" style={{ marginTop: 18 }} onClick={onReset}>진도 초기화</button>

      {BUILD_TIME && <p className="app-updated">최근 업데이트: {formatBuildTime()}</p>}
    </div>
  )
}
