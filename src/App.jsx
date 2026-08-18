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
import { mistakeReviewExercises } from './engine/mistakes.js'
import MistakesView from './components/MistakesView.jsx'
import DeckManager from './components/DeckManager.jsx'
import { setCustomCurriculum } from './data/customSubject.js'
import { decodeDeck } from './engine/deckShare.js'
import { ensureMemberId } from './engine/member.js'
import { buildDailyPractice, dailySeed, mulberry32 } from './engine/practice.js'
import { generatorsFor } from './engine/subjectGenerators.js'
import { SUBJECT_LIST } from './data/subjects.js'
import { resolveRole, isDevHost } from './engine/roles.js'
import { decodeProgress } from './engine/transfer.js'
import { decodeGift, applyGift, giftLabel } from './engine/gifting.js'
import { childSummary, addChild, removeChild } from './engine/children.js'
import { decodeMessage, applyMessage, markRead } from './engine/messages.js'
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
  const [practiceMode, setPracticeMode] = useState(false)
  const [practiceExercises, setPracticeExercises] = useState([])
  const reviewWrongIds = useState(() => new Set())[0]

  const activeSubject = progress.activeSubject || 'english'
  // 커스텀 과목 커리큘럼을 덱에서 동기 파생(로더/Path/SRS가 최신값을 보도록 렌더 최상단에서).
  setCustomCurriculum(progress.decks || [])
  const lessonsById = {}
  const lessonIds = []
  for (const { lesson } of getLessonSequence(activeSubject)) { lessonsById[lesson.id] = lesson; lessonIds.push(lesson.id) }

  // ensure a stable local member number exists (persist once)
  useEffect(() => {
    if (!progress.memberId) persist(ensureMemberId(progress))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const effectiveRole = resolveRole(progress, hostname)
  const isOperator = isDevHost(hostname)

  function addChildByCode(code) {
    const patch = decodeProgress(code, lessonIds)
    if (!patch) return { ok: false, message: '코드를 확인해 주세요.' }
    if (patch.memberId && patch.memberId === progress.memberId) return { ok: false, message: '내 회원번호는 추가할 수 없어요.' }
    const summary = childSummary(patch, lessonIds.length, Date.now())
    persist({ ...progress, children: addChild(progress.children || [], summary) })
    return { ok: true, message: '진도를 불러왔어요.' }
  }
  function removeChildById(memberId) {
    persist({ ...progress, children: removeChild(progress.children || [], memberId) })
  }

  function markMessageRead(index) { persist({ ...progress, messages: markRead(progress.messages || [], index) }) }

  function googleLogin(profile) { persist({ ...progress, google: profile }) }
  function googleLogout() { persist({ ...progress, google: null }) }
  function setRole(role) { persist({ ...progress, role }) }
  function grantGems(n) { persist({ ...progress, gems: progress.gems + n }) }
  function unlockAllLessons() { persist({ ...progress, completedLessons: [...lessonIds] }) }

  // Unified importer: progress-transfer code (LDX1) or gift code (LDG1).
  function importCode(code) {
    const patch = decodeProgress(code, lessonIds)
    if (patch) {
      persist({
        ...progress,
        xp: patch.xp,
        gems: patch.gems,
        dailyGoal: patch.dailyGoal,
        role: patch.role,
        memberId: patch.memberId || progress.memberId,
        completedLessons: patch.completedLessons,
        streak: { ...progress.streak, count: patch.streakCount },
      })
      return { ok: true, message: '진도를 가져왔어요!' }
    }
    const gift = decodeGift(code)
    if (gift) {
      persist(applyGift(progress, gift))
      return { ok: true, message: `선물을 받았어요! (${giftLabel(gift)})` }
    }
    const msg = decodeMessage(code)
    if (msg) {
      persist(applyMessage(progress, msg, Date.now()))
      return { ok: true, message: '응원 메시지를 받았어요! 💌' }
    }
    const deck = decodeDeck(code)
    if (deck) {
      createDeck(deck.name, deck.exercises)
      return { ok: true, message: `문제집을 받았어요! 📚 (${deck.name})` }
    }
    return { ok: false, message: '코드를 확인해 주세요.' }
  }

  // 커스텀 덱 콘텐츠 CRUD (progress.decks). 진도(subjects.custom)는 건드리지 않음.
  function newDeckId() { return `deck-${Date.now()}-${Math.floor(Math.random() * 1000)}` }
  function createDeck(name, exercises) {
    const deck = { id: newDeckId(), name: name || '문제집', exercises: exercises || [], createdAt: Date.now() }
    persist({ ...progress, decks: [...(progress.decks || []), deck] })
  }
  function renameDeck(id, name) {
    persist({ ...progress, decks: (progress.decks || []).map((d) => (d.id === id ? { ...d, name } : d)) })
  }
  function deleteDeck(id) {
    persist({ ...progress, decks: (progress.decks || []).filter((d) => d.id !== id) })
  }
  function openDecks() { setReviewMode(false); setPracticeMode(false); setScreen('decks') }

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

  function persist(next) {
    // keep the active subject's snapshot mirrored to the top-level working copy
    const act = next.activeSubject || 'english'
    const synced = { ...next, subjects: { ...next.subjects, [act]: { completedLessons: next.completedLessons, reviewQueue: next.reviewQueue } } }
    setProgress(synced); saveProgress(synced)
  }

  function switchSubject(id) {
    const emptyCustom = id === 'custom' && (progress.decks || []).length === 0
    if (id === activeSubject) { setScreen(emptyCustom ? 'decks' : 'path'); return }
    const subjects = { ...progress.subjects, [activeSubject]: { completedLessons: progress.completedLessons, reviewQueue: progress.reviewQueue } }
    const target = subjects[id] || { completedLessons: [], reviewQueue: [] }
    setReviewMode(false); setPracticeMode(false)
    persist({ ...progress, subjects, activeSubject: id, completedLessons: target.completedLessons || [], reviewQueue: target.reviewQueue || [] })
    // 덱이 없는 커스텀 과목은 바로 관리 화면으로 안내.
    setScreen(emptyCustom ? 'decks' : 'path')
  }

  function goTab(id) { setTab(id); if (id === 'learn') setScreen('path') }

  function startLesson(id) {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    setActiveLessonId(id)
    setScreen('lesson')
  }
  function handleWrong(exId) {
    if (reviewMode || practiceMode) return // 복습·연습은 하트 차감·오답 기록 없음
    const wasFull = progress.hearts >= 5
    const key = `${activeLessonId}#${exId}`
    const ex = getLessonById(activeLessonId, activeSubject)?.exercises?.[exId]
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
  function openMistakes() { setReviewMode(false); setPracticeMode(false); setScreen('mistakes') }
  // 오답노트 "다시 풀기": 해당 과목으로 전환(필요시) 후 그 과목 오답만 복습.
  function reviewSubjectMistakes(subjectId) {
    if (progress.hearts <= 0) { setScreen('fail'); return }
    let p = progress
    if (subjectId !== activeSubject) {
      const subjects = { ...progress.subjects, [activeSubject]: { completedLessons: progress.completedLessons, reviewQueue: progress.reviewQueue } }
      const target = subjects[subjectId] || { completedLessons: [], reviewQueue: [] }
      p = { ...progress, subjects, activeSubject: subjectId, completedLessons: target.completedLessons || [], reviewQueue: target.reviewQueue || [] }
      persist(p)
    }
    const exercises = mistakeReviewExercises(p.reviewQueue ?? [], { now: Date.now(), limit: 20 })
    if (exercises.length === 0) return
    reviewWrongIds.clear()
    setReviewExercises(exercises)
    setReviewMode(true)
    setActiveLessonId(null)
    setScreen('lesson')
  }
  function startPractice(levelId) {
    const level = getLevels(activeSubject).find((l) => l.id === levelId)
    if (!level) return
    const rng = mulberry32(dailySeed(todayStr(), `${activeSubject}#${levelId}`))
    // subject-specific generators (english/math/…); levels without → pool sampling.
    const generated = generatorsFor(activeSubject, levelId, rng, 6)
    const exercises = buildDailyPractice(level, todayStr(), { size: 10, rng, generated })
    if (exercises.length === 0) return
    setPracticeExercises(exercises)
    setPracticeMode(true)
    setActiveLessonId(null)
    setScreen('lesson')
  }
  function handlePracticeFinish(s) {
    const today = todayStr()
    persist({ ...progress, xp: progress.xp + s.xpGained, dailyXp: addDailyXp(progress.dailyXp, s.xpGained, today) })
    setPracticeMode(false)
    setSummary({ ...s, gemsGained: 0, newAchievements: [] })
    setScreen('result')
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
    const levels = getLevels(activeSubject)
    const idx = levels.findIndex((l) => l.id === startLevel)
    const pre = []
    for (let i = 0; i < idx; i++) for (const u of levels[i].units) for (const l of u.lessons) pre.push(l.id)
    persist({ ...progress, onboarded: true, dailyGoal, completedLessons: pre, quests: ensureQuests(progress.quests, todayStr()) })
  }
  function setTheme(theme) { persist({ ...progress, settings: { ...progress.settings, theme } }) }
  function setGoal(dailyGoal) { persist({ ...progress, dailyGoal }) }
  function resetToOnboarding() {
    // 진도 초기화 → 온보딩(랜딩·학습단계 선택)부터 다시. 테마 설정만 유지.
    const next = { ...defaultProgress(), settings: progress.settings }
    resetProgress(); persist(next); setReviewMode(false); setPracticeMode(false); goTab('learn')
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
          {screen === 'path' && <Path progress={progress} onStart={startLesson} onReview={startReview} onPractice={startPractice}
            onMistakes={openMistakes} onManageDecks={openDecks}
            subject={activeSubject} subjects={SUBJECT_LIST} onSwitchSubject={switchSubject} />}
          {screen === 'mistakes' && (
            <MistakesView progress={progress} onBack={() => setScreen('path')} onReviewSubject={reviewSubjectMistakes} />
          )}
          {screen === 'decks' && (
            <DeckManager decks={progress.decks || []} onCreateDeck={createDeck} onRenameDeck={renameDeck}
              onDeleteDeck={deleteDeck} onImportCode={importCode} onBack={() => setScreen('path')} />
          )}
          {screen === 'lesson' && (
            <Lesson
              lesson={practiceMode
                ? { id: 'practice', title: '오늘의 연습', exercises: practiceExercises }
                : reviewMode
                  ? { id: 'review', title: '복습', exercises: reviewExercises }
                  : getLessonById(activeLessonId, activeSubject)}
              onWrong={handleWrong}
              onExerciseResult={handleExerciseResult}
              onFinish={practiceMode ? handlePracticeFinish : reviewMode ? handleReviewFinish : handleFinish}
              onQuit={() => { setReviewMode(false); setPracticeMode(false); setScreen('path') }}
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
        <Profile progress={progress} onSetTheme={setTheme} onSetGoal={setGoal} onReset={resetToOnboarding}
          lessonIds={lessonIds} onImportCode={importCode}
          role={effectiveRole} isOperator={isOperator}
          onSetRole={setRole} onGrantGems={grantGems} onUnlockAll={unlockAllLessons}
          onGoogleLogin={googleLogin} onGoogleLogout={googleLogout}
          onAddChild={addChildByCode} onRemoveChild={removeChildById}
          memberId={progress.memberId} messages={progress.messages} onMarkRead={markMessageRead} />
      )}

      {showNav && <BottomNav tab={tab} onTab={goTab} />}
    </div>
  )
}
