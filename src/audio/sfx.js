let ctx = null
function ac() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

// note: [frequency, startOffset(s), duration(s), peakGain, type]
function play(notes) {
  const c = ac()
  if (!c) return
  const now = c.currentTime
  for (const [f, off, dur, peak = 0.18, type = 'sine'] of notes) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = f
    o.connect(g)
    g.connect(c.destination)
    const start = now + off
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(peak, start + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.start(start)
    o.stop(start + dur + 0.02)
  }
}

// bright ascending arpeggio (C5-E5-G5-C6)
export function playCorrect() {
  play([
    [523.25, 0.0, 0.14],
    [659.25, 0.07, 0.14],
    [783.99, 0.14, 0.16],
    [1046.5, 0.21, 0.22, 0.2],
  ])
}

// soft descending "try again" buzz (triangle, low)
export function playWrong() {
  play([
    [196.0, 0.0, 0.22, 0.16, 'triangle'],
    [155.56, 0.12, 0.28, 0.16, 'triangle'],
  ])
}

// short celebratory jingle (C-E-G-C-G-C, original)
export function playComplete() {
  play([
    [523.25, 0.0, 0.16],
    [659.25, 0.1, 0.16],
    [783.99, 0.2, 0.16],
    [1046.5, 0.3, 0.2],
    [783.99, 0.42, 0.14, 0.14],
    [1046.5, 0.5, 0.3, 0.2],
  ])
}
