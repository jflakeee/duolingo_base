// Encouragement messages. No backend — a message is an encoded code (QR) the teacher
// hands to the student, who imports it into their inbox.
export const MAX_LEN = 120
const PREFIX = 'LDM1:'
const INBOX_CAP = 20

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

export function encodeMessage({ from = '', to = '', text = '' }) {
  return PREFIX + encStr(JSON.stringify({ f: from, t: to, x: String(text).slice(0, MAX_LEN) }))
}

export function decodeMessage(code) {
  if (typeof code !== 'string') return null
  const c = code.trim()
  if (!c.startsWith(PREFIX)) return null
  try {
    const o = JSON.parse(decStr(c.slice(PREFIX.length)))
    const text = (o.x || '').slice(0, MAX_LEN)
    if (!text.trim()) return null
    return { from: o.f || '', to: o.t || '', text }
  } catch {
    return null
  }
}

// Prepend to the inbox, newest first, capped. New messages start unread.
export function applyMessage(progress, msg, now = 0) {
  const entry = { from: msg.from || '', to: msg.to || '', text: msg.text, at: now, read: false }
  return { ...progress, messages: [entry, ...(progress.messages || [])].slice(0, INBOX_CAP) }
}

// One personalized code per student (same text). Broadcast QR uses to:'' separately.
export function broadcastCodes(studentIds, from, text) {
  return (studentIds || []).map((id) => ({ memberId: id, code: encodeMessage({ from, to: id, text }) }))
}

export function unreadCount(messages) {
  return (messages || []).filter((m) => !m.read).length
}

export function markRead(messages, index) {
  return (messages || []).map((m, i) => (i === index ? { ...m, read: true } : m))
}

export function markAllRead(messages) {
  return (messages || []).map((m) => (m.read ? m : { ...m, read: true }))
}
