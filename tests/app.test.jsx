import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'
import { STORAGE_KEY } from '../src/store/progress.js'

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
})
