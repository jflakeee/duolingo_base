// pure: decide the effective theme
export function resolveTheme(setting, prefersDark) {
  if (setting === 'dark') return 'dark'
  if (setting === 'light') return 'light'
  return prefersDark ? 'dark' : 'light' // 'auto'
}

// side-effect: stamp the html element (guarded for SSR/jsdom-less)
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

// current OS preference (guarded)
export function prefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
