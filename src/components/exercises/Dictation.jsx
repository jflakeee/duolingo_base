import { useEffect, useState } from 'react'
import { checkAnswer } from '../../engine/scoring.js'
import { speak, canSpeak } from '../../audio/tts.js'

export default function Dictation({ exercise, onAnswer }) {
  const [text, setText] = useState('')
  const audio = exercise.audioText ?? exercise.answer
  const empty = text.trim() === ''

  useEffect(() => { speak(audio, exercise.lang) }, [exercise]) // eslint-disable-line react-hooks/exhaustive-deps

  function submit() {
    if (empty) return
    onAnswer(checkAnswer(exercise, text))
  }
  return (
    <div>
      <h2>{exercise.prompt ?? '들리는 문장을 받아쓰세요'}</h2>
      <button className="audio-btn" onClick={() => speak(audio, exercise.lang)}>🔊 다시 듣기</button>
      {!canSpeak() && <p style={{ color: 'var(--muted)' }}>이 기기에서는 오디오를 재생할 수 없어요.</p>}
      <input
        className="typein"
        type="text"
        value={text}
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        placeholder="들은 문장을 입력하세요"
        aria-label="받아쓰기 입력"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
      />
      <div className="action-bar">
        <button className="btn" disabled={empty} onClick={submit}>확인</button>
      </div>
    </div>
  )
}
