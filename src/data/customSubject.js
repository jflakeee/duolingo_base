// '내 문제집' 커스텀 과목의 커리큘럼을 progress.decks에서 런타임 파생.
// SUBJECTS.custom.curriculum이 getter로 이 홀더를 읽는다(subjects.js).
// App 최상단에서 decks 변화 시 setCustomCurriculum 호출 → 로더/Path/SRS 수정 0.

const LESSON_SIZE = 5
const holder = { curriculum: { levels: [] } }

function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

// 덱 1개 = 레벨 1개. 덱 exercises를 5개씩 lessons로 청크.
export function buildCustomCurriculum(decks = []) {
  const levels = (decks || []).map((deck) => {
    const groups = chunk(deck.exercises || [], LESSON_SIZE)
    const lessons = groups.map((exs, i) => ({
      id: `${deck.id}-l${i + 1}`,
      title: groups.length > 1 ? `${deck.name} ${i + 1}` : deck.name,
      exercises: exs,
    }))
    return { id: deck.id, name: deck.name, units: [{ id: `${deck.id}-u1`, title: deck.name, lessons }] }
  })
  return { levels }
}

export function customCurriculum() { return holder.curriculum }

export function setCustomCurriculum(decks) {
  holder.curriculum = buildCustomCurriculum(decks)
  return holder.curriculum
}
