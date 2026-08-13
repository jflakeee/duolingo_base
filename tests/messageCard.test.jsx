import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MessageCard from '../src/components/MessageCard.jsx'
import { decodeMessage } from '../src/engine/messages.js'

describe('MessageCard reply', () => {
  it('generates a reply code addressed back to the original sender', () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.assign(navigator, { clipboard: { writeText } })

    render(<MessageCard msg={{ from: 'LD-TEAC-1111', text: '잘했어요!' }} myMemberId="LD-STU1-2222" />)
    fireEvent.click(screen.getByRole('button', { name: '답장' }))
    fireEvent.change(screen.getByLabelText('답장 메시지'), { target: { value: '감사합니다 선생님!' } })
    fireEvent.click(screen.getByRole('button', { name: '답장 코드 만들기' }))
    fireEvent.click(screen.getByRole('button', { name: /답장 코드 복사/ }))

    const code = writeText.mock.calls[0][0]
    expect(decodeMessage(code)).toEqual({ from: 'LD-STU1-2222', to: 'LD-TEAC-1111', text: '감사합니다 선생님!' })
  })

  it('shows no reply button for an anonymous message', () => {
    render(<MessageCard msg={{ from: '', text: '익명 응원' }} myMemberId="LD-STU1-2222" />)
    expect(screen.queryByRole('button', { name: '답장' })).toBeNull()
  })
})
