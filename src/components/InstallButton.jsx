import { useEffect, useState } from 'react'

// Shows a "install to home screen" button only when the browser offers it
// (captures the beforeinstallprompt event). Hidden once installed or unsupported.
export default function InstallButton() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || !deferred) return null

  async function install() {
    deferred.prompt()
    try { await deferred.userChoice } catch { /* ignore */ }
    setDeferred(null)
  }

  return (
    <button className="btn btn--blue" style={{ marginTop: 12 }} onClick={install}>
      📲 홈 화면에 앱 설치
    </button>
  )
}
