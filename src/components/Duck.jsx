// Original mascot — a friendly yellow duck (NOT an owl). mood: happy|sad|cheer
export default function Duck({ mood = 'happy', size = 96 }) {
  const eyeY = mood === 'sad' ? 40 : 38
  const beakColor = '#ff9800'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`duck-${mood}`} role="img">
      <ellipse cx="50" cy="62" rx="30" ry="28" fill="var(--yellow)" />
      <circle cx="50" cy="38" r="24" fill="var(--yellow)" />
      <circle cx="42" cy={eyeY} r="4" fill="#3c3c3c" />
      <circle cx="58" cy={eyeY} r="4" fill="#3c3c3c" />
      <polygon points="44,46 56,46 50,54" fill={beakColor} />
      {mood === 'cheer' && <text x="78" y="26" fontSize="18">✨</text>}
      {mood === 'sad' && <path d="M44 58 Q50 54 56 58" stroke="#3c3c3c" strokeWidth="2" fill="none" />}
      {mood !== 'sad' && <path d="M44 56 Q50 62 56 56" stroke="#3c3c3c" strokeWidth="2" fill="none" />}
    </svg>
  )
}
