import { useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak } from '../../audio/tts.js'

export default function TypeIn({ exercise, onAnswer }) {
  const [text, setText] = useState('')
  const empty = text.trim() === ''
  function submit() {
    if (empty) return
    onAnswer(checkAnswer(exercise, text))
  }
  return (
    <div>
      <h2>{exercise.prompt}</h2>
      {exercise.audioText && (
        <button className="audio-btn" onClick={() => speak(exercise.audioText)}>🔊 소리 듣기</button>
      )}
      <input
        className="typein"
        type="text"
        value={text}
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        placeholder="여기에 영어로 입력"
        aria-label="답 입력"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
      />
      <div className="action-bar">
        <button className="btn" disabled={empty} onClick={submit}>확인</button>
      </div>
    </div>
  )
}
