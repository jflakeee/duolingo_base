import { generateForLevel as englishGen } from './generators.js'
import { generateMathForLevel as mathGen } from './mathGenerators.js'
import { generateKoreanForLevel as koreanGen } from './koreanGenerators.js'

// Dispatch procedural generators by subject.
export function generatorsFor(subject, levelId, rng, count) {
  if (subject === 'math') return mathGen(levelId, rng, count)
  if (subject === 'korean') return koreanGen(levelId, rng, count)
  return englishGen(levelId, rng, count) // english (default)
}
