import { describe, expect, it } from 'vitest'
import { MAX_ATTEMPTS, PasswordLock } from '../src/puzzle'

describe('PasswordLock', () => {
  it('opens with the configured code', () => {
    const lock = new PasswordLock('0427')
    const result = lock.tryCode('0427')
    expect(result.ok).toBe(true)
    expect(result.solved).toBe(true)
    expect(lock.isSolved).toBe(true)
  })

  it('ignores non-digits and extra characters', () => {
    const lock = new PasswordLock('0427')
    expect(lock.tryCode('0-4-2-7').ok).toBe(true)
    expect(lock.tryCode('042799').ok).toBe(true)
  })

  it('reports the remaining attempts', () => {
    const lock = new PasswordLock('0427')
    expect(lock.tryCode('0000').message).toContain('4')
    expect(lock.tryCode('1111').message).toContain('3')
    expect(lock.attemptCount).toBe(2)
  })

  it('locks the puzzle after the attempt limit', () => {
    const lock = new PasswordLock('0427')
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) lock.tryCode('9999')
    expect(lock.isExhausted).toBe(true)
    expect(lock.tryCode('0427').ok).toBe(false)
  })

  it('is idempotent once solved', () => {
    const lock = new PasswordLock('0427')
    expect(lock.tryCode('0427').ok).toBe(true)
    const again = lock.tryCode('0000')
    expect(again.ok).toBe(true)
    expect(again.message).toContain('已经')
  })

  it('resets back to a clean state', () => {
    const lock = new PasswordLock('0427')
    lock.tryCode('9999')
    lock.reset()
    expect(lock.attemptCount).toBe(0)
    expect(lock.isExhausted).toBe(false)
    expect(lock.tryCode('0427').ok).toBe(true)
  })
})
