// KEEP — generic skeleton, not part of the greet example. Every slice reuses this.
import { describe, expect, it } from 'vitest'
import { err, isErr, isOk, ok } from './result.ts'

describe('Result', () => {
  it('wraps a success', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 })
  })

  it('wraps a failure', () => {
    expect(err({ kind: 'nope' })).toEqual({
      ok: false,
      error: { kind: 'nope' }
    })
  })

  it('narrows a success', () => {
    const result = ok('Ada')
    expect(isOk(result)).toBe(true)
    expect(isErr(result)).toBe(false)
    // The guard narrows: `.value` is reachable without a cast.
    if (isOk(result)) {
      expect(result.value).toBe('Ada')
    }
  })

  it('narrows a failure', () => {
    const result = err({ kind: 'empty-name' } as const)
    expect(isErr(result)).toBe(true)
    expect(isOk(result)).toBe(false)
    if (isErr(result)) {
      expect(result.error.kind).toBe('empty-name')
    }
  })
})
