// 커스텀 덱 공유 — 백엔드 없이 인코딩된 코드(QR)로 전달. 기존 LDX1/LDG1/LDM1 패턴.
const PREFIX = 'LDD1:'
export const MAX_SHARE_EXERCISES = 50

function encStr(s) {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function decStr(str) {
  const t = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeDeck(deck) {
  const exercises = (deck?.exercises || []).slice(0, MAX_SHARE_EXERCISES)
  return PREFIX + encStr(JSON.stringify({ n: deck?.name || '문제집', e: exercises }))
}

export function decodeDeck(code) {
  if (typeof code !== 'string') return null
  const c = code.trim()
  if (!c.startsWith(PREFIX)) return null
  try {
    const o = JSON.parse(decStr(c.slice(PREFIX.length)))
    const exercises = Array.isArray(o.e) ? o.e : []
    if (!exercises.length) return null
    return { name: o.n || '문제집', exercises }
  } catch {
    return null
  }
}
