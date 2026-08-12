// Local member number. No backend — this is a stable local identifier.
// Ambiguity-free charset (no I/O/0/1/L).
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateMemberId(rand = Math.random) {
  let s = ''
  for (let i = 0; i < 8; i++) s += CHARS[Math.floor(rand() * CHARS.length)]
  return `LD-${s.slice(0, 4)}-${s.slice(4)}`
}

// Returns a progress object that is guaranteed to carry a memberId.
export function ensureMemberId(progress, rand = Math.random) {
  if (progress.memberId) return progress
  return { ...progress, memberId: generateMemberId(rand) }
}
