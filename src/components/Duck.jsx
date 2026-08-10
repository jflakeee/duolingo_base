// Original mascot — a friendly yellow duck "덕이" (NOT an owl). mood: happy|sad|cheer
export default function Duck({ mood = 'happy', size = 96, bob = false, animate = null }) {
  const eyeY = mood === 'sad' ? 41 : 39
  const browY = mood === 'cheer' ? 27 : 29
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={`duck-${mood}`}
      role="img"
      className={[bob ? 'bob' : '', animate ? `duck-${animate}` : ''].filter(Boolean).join(' ') || undefined}
    >
      <defs>
        <linearGradient id="dBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="1" stopColor="#ffc800" />
        </linearGradient>
        <linearGradient id="dBeak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb02e" />
          <stop offset="1" stopColor="#ff9500" />
        </linearGradient>
      </defs>

      {/* body */}
      <ellipse cx="50" cy="66" rx="31" ry="27" fill="url(#dBody)" />
      {/* wing */}
      <path d="M24 64 q10 -10 21 -4 q-9 12 -21 8 z" fill="#f4b400" opacity="0.85" />
      {/* head */}
      <circle cx="50" cy="40" r="25" fill="url(#dBody)" />
      {/* tuft */}
      <path d="M50 15 q4 6 -2 10 q-1 -6 2 -10 z" fill="#ffcf33" />
      {/* cheeks */}
      <circle cx="36" cy="46" r="5" fill="#ffb3b3" opacity=".6" />
      <circle cx="64" cy="46" r="5" fill="#ffb3b3" opacity=".6" />
      {/* eyes (white + pupil) — blinking group */}
      <g className="duck-eyes" style={{ transformOrigin: `50px ${eyeY}px` }}>
        <circle cx="42" cy={eyeY} r="6.5" fill="#fff" />
        <circle cx="58" cy={eyeY} r="6.5" fill="#fff" />
        <circle cx={mood === 'cheer' ? 43 : 42} cy={eyeY + 1} r="3.2" fill="#3c3c3c" />
        <circle cx={mood === 'cheer' ? 59 : 58} cy={eyeY + 1} r="3.2" fill="#3c3c3c" />
      </g>
      {/* brows */}
      <path d={`M36 ${browY} q6 -3 11 0`} stroke="#e0a800" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M53 ${browY} q6 -3 11 0`} stroke="#e0a800" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* beak */}
      <ellipse cx="50" cy="52" rx="9" ry="6" fill="url(#dBeak)" />
      <path d="M41 52 q9 5 18 0" stroke="#e07a00" strokeWidth="1.4" fill="none" />
      {/* mouth mood */}
      {mood === 'sad' && (
        <path d="M44 61 q6 -4 12 0" stroke="#e07a00" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {mood === 'cheer' && <text x="74" y="24" fontSize="16">✨</text>}
    </svg>
  )
}
