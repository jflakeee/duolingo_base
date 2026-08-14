import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'
import { STORAGE_KEY } from '../src/store/progress.js'
import { encodeProgress } from '../src/engine/transfer.js'
import { encodeMessage } from '../src/engine/messages.js'
import { getLessonSequence } from '../src/data/loadCurriculum.js'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, onboarded: true }))
})

describe('App smoke', () => {
  it('renders the path with the first lesson unlocked', () => {
    render(<App />)
    // '유치원' appears in the level header and the practice-level <option>
    expect(screen.getAllByText('유치원').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Hello/ })).not.toBeDisabled()
  })

  it('opens a lesson when the first node is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Hello/ }))
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('오늘의 연습 starts a practice session at the selected level', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '연습 시작' }))
    // a synthetic practice lesson is running (has a 확인 button)
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('switches to the 수학 subject and shows a math lesson', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /수학/ })) // subject tab
    // math practice should generate arithmetic; open the first math lesson node
    fireEvent.click(screen.getByRole('button', { name: '연습 시작' }))
    // a math exercise prompt contains an operator (e.g. "3 + 5 = ?")
    expect(document.body.textContent).toMatch(/[+−×÷]|= \?/)
  })

  it('진도 초기화 returns to the onboarding landing (start-level select)', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /프로필/ }))
    fireEvent.click(screen.getByRole('button', { name: '진도 초기화' }))
    // landing welcome is back
    expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument()
  })

  it('roster view (teacher/operator): adds a student by code and shows their progress', () => {
    // jsdom host is localhost → operator, so the 학생 진도 한눈에 roster is visible.
    const ids = getLessonSequence().map((x) => x.lesson.id)
    const code = encodeProgress(
      { memberId: 'LD-KID0-0001', xp: 99, gems: 0, dailyGoal: 50, role: 'learner', streak: { count: 3 }, completedLessons: [ids[0], ids[1]] },
      ids,
    )
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /프로필/ }))
    fireEvent.change(screen.getByLabelText('학생 코드'), { target: { value: code } })
    fireEvent.click(screen.getByRole('button', { name: '학생 추가' }))
    // memberId appears in both the roster row and the message-recipient <option>
    expect(screen.getAllByText('LD-KID0-0001').length).toBeGreaterThan(0)
    expect(screen.getByText('⭐99')).toBeInTheDocument() // roster row only
  })

  it('receives an encouragement message via code into the inbox', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /프로필/ }))
    fireEvent.click(screen.getByRole('button', { name: '코드로 가져오기' }))
    const code = encodeMessage({ from: 'LD-TEAC-1111', text: '오늘도 최고예요!' })
    fireEvent.change(screen.getByLabelText('가져올 코드'), { target: { value: code } })
    fireEvent.click(screen.getByRole('button', { name: '가져오기' }))
    expect(screen.getByText('오늘도 최고예요!')).toBeInTheDocument()
    expect(screen.getByText('— LD-TEAC-1111')).toBeInTheDocument()
  })
})
