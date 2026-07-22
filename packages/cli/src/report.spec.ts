// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import { describe, expect, it } from 'vitest'
import { EXIT_MISUSE, EXIT_UNAVAILABLE, report } from './report.ts'

describe('report — turning a domain tag into CLI presentation', () => {
  it('treats an empty name as user misuse', () => {
    expect(report({ kind: 'empty-name' })).toEqual({
      message: 'a name is required',
      code: EXIT_MISUSE
    })
  })

  it('treats an unreachable source as unavailability, keeping the cause', () => {
    expect(
      report({ kind: 'source-unavailable', cause: 'stdin closed' })
    ).toEqual({
      message: 'could not read the name: stdin closed',
      code: EXIT_UNAVAILABLE
    })
  })

  it('treats an unreachable sink as unavailability, keeping the cause', () => {
    expect(report({ kind: 'sink-unavailable', cause: 'EPIPE' })).toEqual({
      message: 'could not emit the greeting: EPIPE',
      code: EXIT_UNAVAILABLE
    })
  })

  it('distinguishes misuse from unavailability, so a shell can branch', () => {
    expect(report({ kind: 'empty-name' }).code).not.toBe(
      report({ kind: 'sink-unavailable', cause: 'x' }).code
    )
  })

  it('throws rather than guess when handed an unknown tag', () => {
    // Unreachable through the types — this pins the runtime behaviour of the
    // exhaustiveness guard, should a tag ever arrive from untyped code.
    const rogue = { kind: 'invented-later' } as unknown as Parameters<
      typeof report
    >[0]
    expect(() => report(rogue)).toThrow(/unhandled GreetError/)
  })
})
