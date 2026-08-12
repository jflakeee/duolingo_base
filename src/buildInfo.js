// Build timestamp injected by Vite `define` (see vite.config.js). null if unavailable.
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null

// Format an ISO timestamp as a Korea-time "YYYY. MM. DD. HH:mm" string.
export function formatBuildTime(iso = BUILD_TIME) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}
