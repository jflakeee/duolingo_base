import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Mcq from '../src/components/exercises/Mcq.jsx'
import WordBank from '../src/components/exercises/WordBank.jsx'
import Match from '../src/components/exercises/Match.jsx'
import Picture from '../src/components/exercises/Picture.jsx'

describe('Picture', () => {
  const ex = { type: 'picture', prompt: '사과는?', word: 'apple', choices: ['🍎', '🐱', '🏠', '🔴'], answer: '🍎', audioText: 'apple' }
  it('reports correct when right emoji picked', () => {
    const onAnswer = vi.fn()
    render(<Picture exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('🍎'))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
  it('reports wrong when wrong emoji picked', () => {
    const onAnswer = vi.fn()
    render(<Picture exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('🐱'))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
})

describe('Mcq', () => {
  const ex = { type: 'mcq', prompt: 'p', choices: ['Hello', 'Bye'], answer: 'Hello', audioText: 'Hello' }
  it('reports correct when right choice picked', () => {
    const onAnswer = vi.fn()
    render(<Mcq exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Hello'))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
  it('reports wrong when wrong choice picked', () => {
    const onAnswer = vi.fn()
    render(<Mcq exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Bye'))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
})

describe('WordBank', () => {
  const ex = { type: 'wordbank', prompt: 'p', tokens: ['I', 'like', 'blue'], distractors: ['red'], answer: ['I', 'like', 'blue'], audioText: 'I like blue' }
  it('correct when tokens assembled in order', () => {
    const onAnswer = vi.fn()
    render(<WordBank exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByRole('button', { name: 'I' }))
    fireEvent.click(screen.getByRole('button', { name: 'like' }))
    fireEvent.click(screen.getByRole('button', { name: 'blue' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
})

describe('Match', () => {
  const ex = { type: 'match', prompt: 'p', pairs: [['red', '빨강'], ['blue', '파랑']] }
  it('correct when each english mapped to its korean', () => {
    const onAnswer = vi.fn()
    render(<Match exercise={ex} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByRole('button', { name: 'red' }))
    fireEvent.click(screen.getByRole('button', { name: '빨강' }))
    fireEvent.click(screen.getByRole('button', { name: 'blue' }))
    fireEvent.click(screen.getByRole('button', { name: '파랑' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
})
