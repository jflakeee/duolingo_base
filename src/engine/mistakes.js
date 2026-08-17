// 오답노트 — 전 과목 SRS 복습 큐를 사람이 읽을 목록으로 집계. 순수 함수.
import { SUBJECTS, DEFAULT_SUBJECT } from '../data/subjects.js'
import { correctAnswerText } from './answerText.js'

// box(0~4) → 숙달 단계 라벨. box0=갓 틀림, 클수록 숙달.
export function masteryLabel(box = 0) {
  if (box <= 0) return '새 오답'
  if (box === 1) return '학습 중'
  if (box === 2) return '익숙해지는 중'
  if (box === 3) return '거의 완성'
  return '완성 직전'
}

// progress 전체에서 과목별 오답 큐를 모은다.
// 최상위 completedLessons/reviewQueue는 활성 과목 미러이므로, 활성 과목 항목은 그것으로 덮어써 최신 상태 반영.
function subjectQueues(progress) {
  const active = progress.activeSubject || DEFAULT_SUBJECT
  const subjects = { ...(progress.subjects || {}) }
  subjects[active] = { reviewQueue: progress.reviewQueue ?? subjects[active]?.reviewQueue ?? [] }
  return subjects
}

function subjectName(id) { return SUBJECTS[id]?.name || id }
function subjectIcon(id) { return SUBJECTS[id]?.icon || '📘' }

// { total, dueTotal, groups: [{ subjectId, name, icon, dueCount, items: [{ key, prompt, answerText, box, mastery, due }] }] }
export function collectMistakes(progress, now = 0) {
  const queues = subjectQueues(progress)
  const groups = []
  let total = 0
  let dueTotal = 0
  // stable order: registry order
  for (const id of Object.keys(SUBJECTS)) {
    const queue = queues[id]?.reviewQueue || []
    if (!queue.length) continue
    const items = queue
      .map((q) => {
        const due = (q.dueAt ?? 0) <= now
        return {
          key: q.key,
          prompt: (q.ex?.prompt || '').replace(/\s+/g, ' ').trim(),
          answerText: q.ex ? correctAnswerText(q.ex) : '',
          box: q.box ?? 0,
          mastery: masteryLabel(q.box ?? 0),
          due,
        }
      })
      .sort((a, b) => (b.due - a.due) || (a.box - b.box)) // due 먼저, 약한 박스 먼저
    const dueC = items.filter((i) => i.due).length
    total += items.length
    dueTotal += dueC
    groups.push({ subjectId: id, name: subjectName(id), icon: subjectIcon(id), dueCount: dueC, items })
  }
  return { total, dueTotal, groups }
}

// 특정 과목 오답만 복습 세션용 exercise 배열로. filler 없이 오답만(_reviewKey 태깅).
// due 먼저·약한 박스 먼저, 최대 limit개.
export function mistakeReviewExercises(reviewQueue = [], { now = 0, limit = 20 } = {}) {
  return [...reviewQueue]
    .sort((a, b) => (((b.dueAt ?? 0) <= now) - ((a.dueAt ?? 0) <= now)) || ((a.box ?? 0) - (b.box ?? 0)))
    .slice(0, limit)
    .map((q) => ({ ...q.ex, _reviewKey: q.key }))
}
