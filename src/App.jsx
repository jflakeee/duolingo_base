import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Path from './components/Path.jsx'
import Lesson from './components/Lesson.jsx'
import Result from './components/Result.jsx'
import Duck from './components/Duck.jsx'
import BottomNav from './components/BottomNav.jsx'
import Quests from './components/Quests.jsx'
import Shop from './components/Shop.jsx'
import Profile from './components/Profile.jsx'
import Onboarding from './components/Onboarding.jsx'
import { getLessonById, getLevels, getLessonSequence } from './data/loadCurriculum.js'
import { recordMistake, buildReviewSession, applyReviewResult } from './engine/review.js'
import { loadProgress, saveProgress, resetProgress, defaultProgress } from './store/progress.js'
import { loseHeart, updateStreak, addDailyXp, regenHearts, msUntilNextHeart } from './engine/gamification.js'
import { resolveTheme, applyTheme, prefersDark } from './engine/theme.js'
import { gemsForLesson, buyHeartRefill, buyStreakFreeze } from './engine/economy.js'
import { ensureQuests, applyLessonToQuests, claimQuest as claimQuestReward } from './engine/quests.js'
import { newlyUnlocked } from './engine/achievements.js'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const [progress, setProgress] = useState(() => {
    const p = loadProgress()
    const r = regenHearts(p.hearts, p.heartsUpdatedAt ?? Date.now(), Date.now())
    return { ...p, hearts: r.hearts, heartsUpdatedAt: r.heartsUpdatedAt, quests: ensureQuests(p.quests, todayStr()) }
  })
  const [tab, setTab] = useState('learn')
  const [screen, setScreen] = useState('path') // learn sub-screen: path|lesson|result|fail
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewExercises, setReviewExercises] = useState([])
  const reviewWrongIds = useState(() => new Set())[0]

  const lessonsById = {}
  for (const { lesson } of getLessonSequence()) lessonsById[lesson.id] = lesson

  // apply theme on mount + when the setting changes; follow OS when 'auto'
  useEffect(() => {
    const setting = progress.settings.theme
    applyTheme(resolveTheme(setting, prefersDark()))
    if (setting !== 'auto' || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(resolveTheme('auto', mq.matches))
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [progress.settings.theme])

  function persist(next) { setProgress(next); saveProgress(next) }

  function goTab(id) { setTab(id); if (id === 'learn') setScreen('path') }

  function startLesson(id) {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    setActiveLessonId(id)
    setScreen('lesson')
  }
  function handleWrong(exId) {
    if (reviewMode) return // 복습은 하트 차감·오답 기록 없음
    const wasFull = progress.hearts >= 5
    const key = `${activeLessonId}#${exId}`
    const ex = getLessonById(activeLessonId)?.exercises?.[exId]
    const withMistake = ex
      ? { ...progress, reviewQueue: recordMistake(progress.reviewQueue ?? [], { key, lessonId: activeLessonId, ex }, Date.now()) }
      : progress
    const next = { ...withMistake, hearts: loseHeart(progress.hearts), heartsUpdatedAt: wasFull ? Date.now() : progress.heartsUpdatedAt }
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
    const perfect = s.mistakes === 0
    const gemsGained = gemsForLesson({ mistakes: s.mistakes })
    const afterLesson = {
      ...progress,
      xp: progress.xp + s.xpGained,
      gems: progress.gems + gemsGained,
      perfectCount: (progress.perfectCount || 0) + (perfect ? 1 : 0),
      dailyXp: addDailyXp(progress.dailyXp, s.xpGained, today),
      streak: updateStreak(progress.streak, today),
      completedLessons: progress.completedLessons.includes(activeLessonId)
        ? progress.completedLessons
        : [...progress.completedLessons, activeLessonId],
      quests: applyLessonToQuests(ensureQuests(progress.quests, today), { xpGained: s.xpGained, perfect }),
    }
    const newIds = newlyUnlocked(afterLesson)
    const achievements = { ...afterLesson.achievements }
    for (const id of newIds) achievements[id] = today
    const next = { ...afterLesson, achievements }
    persist(next)
    setSummary({ ...s, gemsGained, newAchievements: newIds })
    setScreen('result')
  }

  function startReview() {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    const exercises = buildReviewSession(
      { reviewQueue: progress.reviewQueue ?? [], completedLessons: progress.completedLessons },
      lessonsById,
      { now: Date.now() },
    )
    if (exercises.length === 0) return
    reviewWrongIds.clear()
    setReviewExercises(exercises)
    setReviewMode(true)
    setActiveLessonId(null)
    setScreen('lesson')
  }
  function handleExerciseResult(exId, isCorrect) {
    if (reviewMode && !isCorrect) reviewWrongIds.add(exId)
  }
  function handleReviewFinish(s) {
    const keyed = reviewExercises.map((ex, i) => ({ ex, i })).filter(({ ex }) => ex._reviewKey)
    const solvedKeys = keyed.filter(({ i }) => !reviewWrongIds.has(i)).map(({ ex }) => ex._reviewKey)
    const wrongKeys = keyed.filter(({ i }) => reviewWrongIds.has(i)).map(({ ex }) => ex._reviewKey)
    const today = todayStr()
    const next = {
      ...progress,
      xp: progress.xp + s.xpGained,
      dailyXp: addDailyXp(progress.dailyXp, s.xpGained, today),
      reviewQueue: applyReviewResult(progress.reviewQueue ?? [], solvedKeys, wrongKeys, Date.now()),
    }
    persist(next)
    setReviewMode(false)
    setSummary({ ...s, gemsGained: 0, newAchievements: [] })
    setScreen('result')
  }

  function handleOnboarded({ dailyGoal, startLevel }) {
    const levels = getLevels()
    const idx = levels.findIndex((l) => l.id === startLevel)
    const pre = []
    for (let i = 0; i < idx; i++) for (const u of levels[i].units) for (const l of u.lessons) pre.push(l.id)
    persist({ ...progress, onboarded: true, dailyGoal, completedLessons: pre, quests: ensureQuests(progress.quests, todayStr()) })
  }
  function setTheme(theme) { persist({ ...progress, settings: { ...progress.settings, theme } }) }
  function setGoal(dailyGoal) { persist({ ...progress, dailyGoal }) }
  function resetKeepOnboarding() {
    const next = { ...defaultProgress(), onboarded: true, settings: progress.settings, dailyGoal: progress.dailyGoal }
    resetProgress(); persist(next); goTab('learn')
  }
  function claimQuest(id) {
    const today = todayStr()
    const q = ensureQuests(progress.quests, today)
    const { quests, reward } = claimQuestReward(q, id)
    persist({ ...progress, quests, gems: progress.gems + reward })
  }
  function buyHearts() {
    const r = buyHeartRefill(progress.gems, progress.hearts)
    if (r.ok) persist({ ...progress, gems: r.gems, hearts: r.hearts })
  }
  function buyFreeze() {
    const r = buyStreakFreeze(progress.gems, progress.streak.freezes)
    if (r.ok) persist({ ...progress, gems: r.gems, streak: { ...progress.streak, freezes: r.freezes } })
  }

  if (!progress.onboarded) return <Onboarding onDone={handleOnboarded} />

  const inLessonFlow = tab === 'learn' && screen !== 'path'
  const showHeader = !(tab === 'learn' && screen === 'lesson')
  const showNav = !inLessonFlow

  return (
    <div className="app">
      {showHeader && <Header progress={progress} />}

      {tab === 'learn' && (
        <>
          {screen === 'path' && <Path progress={progress} onStart={startLesson} onReview={startReview} />}
          {screen === 'lesson' && (
            <Lesson
              lesson={reviewMode
                ? { id: 'review', title: '복습', exercises: reviewExercises }
                : getLessonById(activeLessonId)}
              onWrong={handleWrong}
              onExerciseResult={handleExerciseResult}
              onFinish={reviewMode ? handleReviewFinish : handleFinish}
              onQuit={() => { setReviewMode(false); setScreen('path') }}
            />
          )}
          {screen === 'result' && summary && (
            <Result summary={summary} streak={progress.streak.count} onContinue={goPath} />
          )}
          {screen === 'fail' && (
            <div className="fail">
              <Duck mood="sad" size={128} />
              <h2>하트가 없어요 💔</h2>
              <p>잠시 후 다시 도전하거나 프로필에서 초기화할 수 있어요.</p>
              <p>다음 하트까지 약 {Math.ceil(msUntilNextHeart(progress.hearts, progress.heartsUpdatedAt, Date.now()) / 60000)}분</p>
              <div style={{ marginTop: 20 }}><button className="btn" onClick={goPath}>경로로 돌아가기</button></div>
            </div>
          )}
        </>
      )}

      {tab === 'quests' && <Quests progress={progress} onClaim={claimQuest} />}
      {tab === 'shop' && <Shop progress={progress} onBuyHearts={buyHearts} onBuyFreeze={buyFreeze} />}
      {tab === 'profile' && (
        <Profile progress={progress} onSetTheme={setTheme} onSetGoal={setGoal} onReset={resetKeepOnboarding} />
      )}

      {showNav && <BottomNav tab={tab} onTab={goTab} />}
    </div>
  )
}
