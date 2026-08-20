// KEEP — generic skeleton, not part of the greet example. Every slice reuses this.
import { describe, expect, it } from 'vitest'
import { err, ok, type Result } from './result.ts'

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

  // There are no `isOk`/`isErr` guards, and these two cases say why: `ok` is a
  // literal discriminant, so TypeScript narrows on it for free. A guard would
  // only rename the check. Add one when a call site needs it as a VALUE
  // (`results.filter(isOk)`) — `shared/` grows on a second consumer, not on
  // anticipation.
  it('narrows to the success branch on the discriminant alone', () => {
    const result: Result<string, { kind: 'empty-name' }> = ok('Ada')
    if (!result.ok) throw new Error('unreachable')
    // `.value` is reachable without a cast and without a guard.
    expect(result.value).toBe('Ada')
  })

  it('narrows to the failure branch on the discriminant alone', () => {
    const result: Result<string, { kind: 'empty-name' }> = err({
      kind: 'empty-name'
    })
    if (result.ok) throw new Error('unreachable')
    expect(result.error.kind).toBe('empty-name')
  })
})
