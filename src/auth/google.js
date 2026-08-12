// Google Identity Services (GIS) — client-side only. No backend token verification.
const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Decode the JWT ID token payload → { sub, name, picture, email }. Pure/testable.
export function parseIdToken(jwt) {
  try {
    const seg = jwt.split('.')[1]
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const o = JSON.parse(new TextDecoder().decode(bytes))
    if (!o.sub) return null
    return { sub: o.sub, name: o.name || '', picture: o.picture || '', email: o.email || '' }
  } catch {
    return null
  }
}

// Load the GIS script once (online only). Resolves with window.google.
let gisPromise = null
export function loadGis() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve(window.google)
    s.onerror = () => reject(new Error('GIS load failed'))
    document.head.appendChild(s)
  })
  return gisPromise
}

// Initialize GIS with the client id and render the sign-in button into `el`.
// onProfile is called with the parsed profile on success.
export async function initGoogleButton(clientId, el, onProfile) {
  const google = await loadGis()
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (res) => {
      const profile = parseIdToken(res.credential)
      if (profile) onProfile(profile)
    },
  })
  google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with' })
}
