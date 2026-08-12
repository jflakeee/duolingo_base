// Parent-view of children. Snapshots imported from a child's share code (no backend/live sync).

// Build a compact, display-only summary from a decoded progress patch.
export function childSummary(patch, total, addedAt = 0) {
  const completed = (patch.completedLessons || []).length
  return {
    memberId: patch.memberId || '',
    xp: patch.xp || 0,
    streakCount: patch.streakCount || 0,
    gems: patch.gems || 0,
    completed,
    total,
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    addedAt,
  }
}

// Upsert by memberId (re-adding a child refreshes their snapshot).
export function addChild(children, summary) {
  const rest = (children || []).filter((c) => c.memberId !== summary.memberId)
  return [...rest, summary]
}

export function removeChild(children, memberId) {
  return (children || []).filter((c) => c.memberId !== memberId)
}
