import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../authConfig.js'
import { initGoogleButton } from '../auth/google.js'

// 구글 로그인. Client ID 미설정 시 UI 숨김(운영자에게만 안내). 백엔드 검증 없음.
export default function GoogleAuth({ google, onLogin, onLogout, isOperator }) {
  const btnRef = useRef(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (google || !GOOGLE_CLIENT_ID || !btnRef.current) return
    let alive = true
    initGoogleButton(GOOGLE_CLIENT_ID, btnRef.current, (p) => { if (alive) onLogin(p) })
      .catch(() => { if (alive) setErr(true) })
    return () => { alive = false }
  }, [google]) // eslint-disable-line react-hooks/exhaustive-deps

  if (google) {
    return (
      <div className="gauth gauth--in">
        {google.picture && <img className="gauth__pic" src={google.picture} alt="" width={36} height={36} referrerPolicy="no-referrer" />}
        <div className="gauth__who">
          <div className="gauth__name">{google.name || '구글 사용자'}</div>
          {google.email && <div className="gauth__email">{google.email}</div>}
        </div>
        <button className="btn btn--sm btn--ghost" onClick={onLogout}>로그아웃</button>
      </div>
    )
  }

  if (!GOOGLE_CLIENT_ID) {
    return isOperator
      ? <p className="gauth__hint">구글 로그인: <code>src/authConfig.js</code>에 Client ID를 설정하면 활성화돼요.</p>
      : null
  }

  return (
    <div className="gauth">
      <div ref={btnRef} />
      {err && <p className="gauth__hint">구글 로그인을 불러오지 못했어요(네트워크/설정 확인).</p>}
    </div>
  )
}
