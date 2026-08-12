import { describe, it, expect } from 'vitest'
import { generateMemberId, ensureMemberId } from '../src/engine/member.js'

describe('generateMemberId', () => {
  it('produces the LD-XXXX-XXXX format with ambiguity-free chars', () => {
    expect(generateMemberId(() => 0)).toMatch(/^LD-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  })
  it('is deterministic given a fixed rng', () => {
    expect(generateMemberId(() => 0)).toBe('LD-AAAA-AAAA')
  })
})

describe('ensureMemberId', () => {
  it('adds a memberId when missing', () => {
    const p = ensureMemberId({ xp: 1 }, () => 0)
    expect(p.memberId).toBe('LD-AAAA-AAAA')
  })
  it('leaves an existing memberId untouched', () => {
    const p = { memberId: 'LD-ZZZZ-ZZZZ' }
    expect(ensureMemberId(p, () => 0)).toBe(p)
  })
})
