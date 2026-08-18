import { generateForLevel as englishGen } from './generators.js'
import { generateMathForLevel as mathGen } from './mathGenerators.js'
import { generateKoreanForLevel as koreanGen } from './koreanGenerators.js'
import { generateEssayForLevel as essayGen } from './essayGenerators.js'
import { generateLogicForLevel as logicGen } from './logicGenerators.js'

// Dispatch procedural generators by subject.
export function generatorsFor(subject, levelId, rng, count) {
  if (subject === 'math') return mathGen(levelId, rng, count)
  if (subject === 'korean') return koreanGen(levelId, rng, count)
  if (subject === 'essay') return essayGen(levelId, rng, count)
  if (subject === 'logic') return logicGen(levelId, rng, count)
  if (subject === 'custom') return [] // 커스텀 덱은 생성기 없음 — 연습은 덱 문제 풀에서 샘플
  return englishGen(levelId, rng, count) // english (default)
}
