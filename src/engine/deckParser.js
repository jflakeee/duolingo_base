// 커스텀 덱 붙여넣기 파서. 순수 함수.
// 줄 단위, 파이프(|)로 필드 분리:
//   질문 | 정답              → typein
//   질문 | 정답 | 오답…      → mcq (보기 = [정답, ...오답] 중복 제거 후 최대 4개)
// 빈 줄 무시. 형식 오류는 errors에 { line, text, reason }로 수집.

const MAX_CHOICES = 4

export function parseDeck(text) {
  const exercises = []
  const errors = []
  const lines = String(text ?? '').split(/\r?\n/)
  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    const lineNo = i + 1
    const fields = line.split('|').map((f) => f.trim())
    const prompt = fields[0]
    if (!prompt) {
      errors.push({ line: lineNo, text: line, reason: '질문이 비어 있어요.' })
      return
    }
    const rest = fields.slice(1).filter((f) => f.length > 0)
    if (rest.length === 0) {
      errors.push({ line: lineNo, text: line, reason: '정답이 없어요. "질문 | 정답" 형식으로 적어 주세요.' })
      return
    }
    if (rest.length === 1) {
      exercises.push({ type: 'typein', prompt, answer: rest[0] })
      return
    }
    // mcq: 첫 나머지 = 정답, 이후 = 오답. 중복 제거 후 보기 구성.
    const answer = rest[0]
    const choices = []
    for (const c of rest) {
      if (!choices.includes(c) && choices.length < MAX_CHOICES) choices.push(c)
    }
    if (choices.length < 2) {
      errors.push({ line: lineNo, text: line, reason: '보기가 모두 같아요. 서로 다른 오답을 적어 주세요.' })
      return
    }
    exercises.push({ type: 'mcq', prompt, choices, answer })
  })
  return { exercises, errors }
}
