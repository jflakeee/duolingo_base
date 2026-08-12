// Progress-transfer codec. Encodes a compact, self-contained payload (no backend)
// suitable for a QR code: core stats + a bitmask of completed lessons.
// reviewQueue/achievements/quests are intentionally omitted (regenerate naturally).

const PREFIX = 'LDX1:'

function bytesToB64url(bytes) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlToBytes(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(pad)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
function strToB64url(str) {
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff
  return bytesToB64url(bytes)
}
function b64urlToStr(str) {
  const bytes = b64urlToBytes(str)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return s
}

function packBits(lessonIds, completedSet) {
  const bytes = new Uint8Array(Math.ceil(lessonIds.length / 8))
  lessonIds.forEach((id, i) => {
    if (completedSet.has(id)) bytes[i >> 3] |= 1 << (i & 7)
  })
  return bytesToB64url(bytes)
}

export function encodeProgress(progress, lessonIds) {
  const done = new Set(progress.completedLessons || [])
  const obj = {
    v: 1,
    m: progress.memberId || '',
    xp: progress.xp || 0,
    s: progress.streak?.count || 0,
    g: progress.gems || 0,
    dg: progress.dailyGoal || 50,
    r: progress.role || 'learner',
    b: packBits(lessonIds, done),
  }
  return PREFIX + strToB64url(JSON.stringify(obj))
}

// Returns a partial-progress patch, or null if the code is invalid.
export function decodeProgress(code, lessonIds) {
  if (typeof code !== 'string') return null
  const trimmed = code.trim()
  if (!trimmed.startsWith(PREFIX)) return null
  try {
    const o = JSON.parse(b64urlToStr(trimmed.slice(PREFIX.length)))
    if (o.v !== 1) return null
    const bytes = b64urlToBytes(o.b || '')
    const completedLessons = lessonIds.filter((_, i) => (bytes[i >> 3] >> (i & 7)) & 1)
    return {
      memberId: o.m || '',
      xp: o.xp || 0,
      gems: o.g || 0,
      dailyGoal: o.dg || 50,
      role: o.r || 'learner',
      streakCount: o.s || 0,
      completedLessons,
    }
  } catch {
    return null
  }
}
