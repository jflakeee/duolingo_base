import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'

beforeEach(() => localStorage.clear())

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
})
