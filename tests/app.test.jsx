import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'
import { STORAGE_KEY } from '../src/store/progress.js'
import { encodeProgress } from '../src/engine/transfer.js'
import { getLessonSequence } from '../src/data/loadCurriculum.js'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, onboarded: true }))
})

describe('App smoke', () => {
  it('renders the path with the first lesson unlocked', () => {
    render(<App />)
    expect(screen.getByText('유치원')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hello/ })).not.toBeDisabled()
  })

  it('opens a lesson when the first node is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Hello/ }))
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('진도 초기화 returns to the onboarding landing (start-level select)', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /프로필/ }))
    fireEvent.click(screen.getByRole('button', { name: '진도 초기화' }))
    // landing welcome is back
    expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument()
  })

  it('parent view: adds a child by their share code and shows their progress', () => {
    // jsdom host is localhost → operator, so the 자녀 진도 panel is visible.
    const ids = getLessonSequence().map((x) => x.lesson.id)
    const childCode = encodeProgress(
      { memberId: 'LD-KID0-0001', xp: 99, gems: 0, dailyGoal: 50, role: 'learner', streak: { count: 3 }, completedLessons: [ids[0], ids[1]] },
      ids,
    )
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /프로필/ }))
    fireEvent.change(screen.getByLabelText('자녀 코드'), { target: { value: childCode } })
    fireEvent.click(screen.getByRole('button', { name: '자녀 추가' }))
    expect(screen.getByText('LD-KID0-0001')).toBeInTheDocument()
    expect(screen.getByText(/99 XP/)).toBeInTheDocument()
  })
})
