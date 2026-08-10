import { describe, it, expect } from 'vitest'
import { playCorrect, playWrong, playComplete } from '../src/audio/sfx.js'

// jsdom has no AudioContext → all sfx must be guarded no-ops that never throw.
describe('sfx (guarded)', () => {
  it('playCorrect does not throw without AudioContext', () => {
    expect(() => playCorrect()).not.toThrow()
  })
  it('playWrong does not throw', () => {
    expect(() => playWrong()).not.toThrow()
  })
  it('playComplete does not throw', () => {
    expect(() => playComplete()).not.toThrow()
  })
})
