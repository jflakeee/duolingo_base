import { describe, it, expect } from 'vitest'
import { isDevHost, resolveRole, canGift } from '../src/engine/roles.js'

describe('isDevHost', () => {
  it('is true for localhost and loopback', () => {
    expect(isDevHost('localhost')).toBe(true)
    expect(isDevHost('127.0.0.1')).toBe(true)
    expect(isDevHost('::1')).toBe(true)
  })
  it('is false for the deployed host', () => {
    expect(isDevHost('jflakeee.github.io')).toBe(false)
  })
})

describe('resolveRole', () => {
  it('forces operator on a dev host regardless of stored role', () => {
    expect(resolveRole({ role: 'learner' }, 'localhost')).toBe('operator')
  })
  it('uses the stored role on the deployed host', () => {
    expect(resolveRole({ role: 'parent' }, 'jflakeee.github.io')).toBe('parent')
    expect(resolveRole({}, 'jflakeee.github.io')).toBe('learner')
  })
})

describe('canGift', () => {
  it('allows parent/teacher/operator, not learner', () => {
    expect(canGift('parent')).toBe(true)
    expect(canGift('teacher')).toBe(true)
    expect(canGift('operator')).toBe(true)
    expect(canGift('learner')).toBe(false)
  })
})
