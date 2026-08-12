import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GoogleAuth from '../src/components/GoogleAuth.jsx'

// GOOGLE_CLIENT_ID defaults to '' → login button hidden; only signed-in view + operator hint apply.
describe('GoogleAuth', () => {
  it('shows the signed-in profile and logs out', () => {
    const onLogout = vi.fn()
    render(<GoogleAuth google={{ name: '덕이', email: 'a@b.com' }} onLogin={vi.fn()} onLogout={onLogout} />)
    expect(screen.getByText('덕이')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(onLogout).toHaveBeenCalled()
  })
  it('shows a setup hint to the operator when no Client ID is configured', () => {
    render(<GoogleAuth google={null} isOperator onLogin={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.getByText(/Client ID/)).toBeInTheDocument()
  })
  it('renders nothing for a normal user when unconfigured', () => {
    const { container } = render(<GoogleAuth google={null} isOperator={false} onLogin={vi.fn()} onLogout={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
