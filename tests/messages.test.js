import { describe, it, expect } from 'vitest'
import { encodeMessage, decodeMessage, applyMessage, unreadCount, markRead, markAllRead, broadcastCodes, MAX_LEN } from '../src/engine/messages.js'

describe('message codec', () => {
  it('round-trips a Korean message with sender/recipient', () => {
    const code = encodeMessage({ from: 'LD-TEAC-1111', to: 'LD-STU1-2222', text: '오늘도 잘했어요! 👏' })
    expect(code.startsWith('LDM1:')).toBe(true)
    expect(decodeMessage(code)).toEqual({ from: 'LD-TEAC-1111', to: 'LD-STU1-2222', text: '오늘도 잘했어요! 👏' })
  })
  it('truncates text to MAX_LEN', () => {
    const long = 'a'.repeat(MAX_LEN + 50)
    expect(decodeMessage(encodeMessage({ text: long })).text.length).toBe(MAX_LEN)
  })
  it('rejects empty text, wrong prefix, and garbage', () => {
    expect(decodeMessage(encodeMessage({ text: '   ' }))).toBeNull()
    expect(decodeMessage('LDX1:abc')).toBeNull()
    expect(decodeMessage('LDM1:@@@')).toBeNull()
  })
})

describe('applyMessage', () => {
  it('prepends to the inbox (newest first)', () => {
    let p = { messages: [] }
    p = applyMessage(p, { from: 'A', text: '첫 메시지' }, 1)
    p = applyMessage(p, { from: 'B', text: '둘째 메시지' }, 2)
    expect(p.messages.map((m) => m.text)).toEqual(['둘째 메시지', '첫 메시지'])
    expect(p.messages[0].at).toBe(2)
  })
  it('caps the inbox at 20', () => {
    let p = { messages: [] }
    for (let i = 0; i < 25; i++) p = applyMessage(p, { text: `m${i}` }, i)
    expect(p.messages).toHaveLength(20)
    expect(p.messages[0].text).toBe('m24')
  })
  it('new messages start unread', () => {
    const p = applyMessage({ messages: [] }, { text: 'hi' }, 1)
    expect(p.messages[0].read).toBe(false)
  })
})

describe('read tracking', () => {
  const msgs = [{ text: 'a', read: false }, { text: 'b', read: true }, { text: 'c', read: false }]
  it('unreadCount counts unread messages', () => {
    expect(unreadCount(msgs)).toBe(2)
    expect(unreadCount([])).toBe(0)
  })
  it('markRead marks one by index without touching others', () => {
    const out = markRead(msgs, 0)
    expect(out[0].read).toBe(true)
    expect(out[2].read).toBe(false)
    expect(msgs[0].read).toBe(false) // immutable
  })
  it('markAllRead marks every message read', () => {
    expect(unreadCount(markAllRead(msgs))).toBe(0)
  })
})

describe('broadcastCodes', () => {
  it('makes one personalized code per student', () => {
    const out = broadcastCodes(['LD-A', 'LD-B'], 'LD-TEAC', '모두 화이팅!')
    expect(out.map((x) => x.memberId)).toEqual(['LD-A', 'LD-B'])
    expect(decodeMessage(out[0].code)).toEqual({ from: 'LD-TEAC', to: 'LD-A', text: '모두 화이팅!' })
    expect(decodeMessage(out[1].code)).toEqual({ from: 'LD-TEAC', to: 'LD-B', text: '모두 화이팅!' })
  })
  it('returns empty for no students', () => {
    expect(broadcastCodes([], 'T', 'x')).toEqual([])
  })
})
