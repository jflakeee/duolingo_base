let ctx = null
function ac() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

function beep(freqs) {
  const c = ac()
  if (!c) return
  const now = c.currentTime
  freqs.forEach(([f, t], i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.value = f
    o.type = 'sine'
    o.connect(g)
    g.connect(c.destination)
    const start = now + i * 0.09
    g.gain.setValueAtTime(0.001, start)
    g.gain.exponentialRampToValueAtTime(0.2, start + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, start + t)
    o.start(start)
    o.stop(start + t)
  })
}

export function playCorrect() {
  beep([[660, 0.12], [880, 0.16]])
}
export function playWrong() {
  beep([[300, 0.2], [200, 0.24]])
}
