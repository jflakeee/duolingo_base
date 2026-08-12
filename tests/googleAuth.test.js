import { describe, it, expect } from 'vitest'
import { parseIdToken } from '../src/auth/google.js'

// build a fake JWT (header.payload.signature) with a base64url payload
function makeJwt(payloadObj) {
  const json = JSON.stringify(payloadObj)
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `h.${b64}.s`
}

describe('parseIdToken', () => {
  it('extracts sub/name/picture/email', () => {
    const jwt = makeJwt({ sub: '12345', name: '덕이', picture: 'https://x/y.png', email: 'a@b.com' })
    expect(parseIdToken(jwt)).toEqual({ sub: '12345', name: '덕이', picture: 'https://x/y.png', email: 'a@b.com' })
  })
  it('returns null without a sub', () => {
    expect(parseIdToken(makeJwt({ name: 'no sub' }))).toBeNull()
  })
  it('returns null for a malformed token', () => {
    expect(parseIdToken('not-a-jwt')).toBeNull()
  })
})
