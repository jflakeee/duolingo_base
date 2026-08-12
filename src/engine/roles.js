// Client-side roles. NOT real security — a localStorage flag used only for UX gating.
export const ROLE_LABELS = { learner: '학습자', parent: '부모', teacher: '선생님', operator: '운영자' }
export const SELECTABLE_ROLES = ['learner', 'parent', 'teacher']

// Developer machine → operator privileges automatically.
export function isDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]'
}

export function resolveRole(progress, hostname) {
  if (isDevHost(hostname)) return 'operator'
  return progress.role || 'learner'
}

// parent / teacher / operator can access the purchase & gift panel.
export function canGift(role) {
  return role === 'parent' || role === 'teacher' || role === 'operator'
}
