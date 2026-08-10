import { useState } from 'react'
import Header from './components/Header.jsx'
import Path from './components/Path.jsx'
import Lesson from './components/Lesson.jsx'
import Result from './components/Result.jsx'
import Duck from './components/Duck.jsx'
import { getLessonById } from './data/loadCurriculum.js'
import { loadProgress, saveProgress, resetProgress, defaultProgress } from './store/progress.js'
import { loseHeart, updateStreak, addDailyXp, regenHearts, msUntilNextHeart } from './engine/gamification.js'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const [progress, setProgress] = useState(() => {
    const p = loadProgress()
    const r = regenHearts(p.hearts, p.heartsUpdatedAt ?? Date.now(), Date.now())
    return { ...p, hearts: r.hearts, heartsUpdatedAt: r.heartsUpdatedAt }
  })
  const [screen, setScreen] = useState('path') // 'path' | 'lesson' | 'result' | 'fail'
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [summary, setSummary] = useState(null)

  function persist(next) { setProgress(next); saveProgress(next) }

  function startLesson(id) {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    setActiveLessonId(id)
    setScreen('lesson')
  }

  function handleWrong() {
    const wasFull = progress.hearts >= 5
    const next = {
      ...progress,
      hearts: loseHeart(progress.hearts),
      heartsUpdatedAt: wasFull ? Date.now() : progress.heartsUpdatedAt,
    }
    persist(next)
    if (next.hearts <= 0) setScreen('fail')
  }

  function goPath() {
    const r = regenHearts(progress.hearts, progress.heartsUpdatedAt, Date.now())
    if (r.hearts !== progress.hearts) persist({ ...progress, hearts: r.hearts, heartsUpdatedAt: r.heartsUpdatedAt })
    setScreen('path')
  }

  function handleFinish(s) {
    const today = todayStr()
    const next = {
      ...progress,
      xp: progress.xp + s.xpGained,
      dailyXp: addDailyXp(progress.dailyXp, s.xpGained, today),
      streak: updateStreak(progress.streak, today),
      completedLessons: progress.completedLessons.includes(activeLessonId)
        ? progress.completedLessons
        : [...progress.completedLessons, activeLessonId],
    }
    persist(next)
    setSummary(s)
    setScreen('result')
  }

  function hardReset() {
    resetProgress()
    persist(defaultProgress())
    setScreen('path')
  }

  return (
    <div className="app">
      <Header progress={progress} />
      {screen === 'path' && (
        <>
          <Path progress={progress} onStart={startLesson} />
          <button className="btn btn--ghost" style={{ marginTop: 20 }} onClick={hardReset}>진도 초기화</button>
        </>
      )}
      {screen === 'lesson' && (
        <Lesson
          lesson={getLessonById(activeLessonId)}
          onWrong={handleWrong}
          onFinish={handleFinish}
          onQuit={() => setScreen('path')}
        />
      )}
      {screen === 'result' && summary && (
        <Result summary={summary} streak={progress.streak.count} onContinue={goPath} />
      )}
      {screen === 'fail' && (
        <div className="fail">
          <Duck mood="sad" size={128} />
          <h2>하트가 없어요 💔</h2>
          <p>잠시 후 다시 도전하거나 진도를 초기화할 수 있어요.</p>
          <p>다음 하트까지 약 {Math.ceil(msUntilNextHeart(progress.hearts, progress.heartsUpdatedAt, Date.now()) / 60000)}분</p>
          <div style={{ marginTop: 20 }}>
            <button className="btn" onClick={goPath}>경로로 돌아가기</button>
          </div>
        </div>
      )}
    </div>
  )
}
