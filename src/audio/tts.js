export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text, lang = 'en-US') {
  if (!canSpeak() || !text) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}
