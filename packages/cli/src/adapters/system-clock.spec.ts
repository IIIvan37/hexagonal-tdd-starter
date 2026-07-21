import { clockContract } from '@app/core/testing'
import { describe, expect, it } from 'vitest'
import { SystemClock } from './system-clock.ts'

// The port obligations, replayed against the real host clock.
clockContract('SystemClock', () => ({ clock: new SystemClock() }))

describe('SystemClock — host specifics', () => {
  it('reports the current time, not a frozen one', () => {
    const clock = new SystemClock()
    const before = Date.now()
    const reading = clock.now().epochMs
    const after = Date.now()

    expect(reading).toBeGreaterThanOrEqual(before)
    expect(reading).toBeLessThanOrEqual(after)
  })

  it('flips the sign of getTimezoneOffset, so east of UTC is positive', () => {
    // Date's convention is minutes to add to LOCAL to reach UTC; Instant's is
    // the reverse. Whatever the host timezone, the two must be opposites.
    expect(new SystemClock().now().offsetMinutes).toBe(
      -new Date().getTimezoneOffset()
    )
  })
})
