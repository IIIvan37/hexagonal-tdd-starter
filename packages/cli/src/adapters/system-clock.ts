// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import type { Clock, Instant } from '@app/core'

/**
 * Driven adapter: the real clock, read from the host.
 *
 * This is where the impurity is quarantined. `new Date()` reads ambient state,
 * and `getTimezoneOffset()` reads the machine's configuration — both are the
 * kind of hidden dependency that makes a core untestable, which is exactly why
 * the core takes a `Clock` instead.
 *
 * `getTimezoneOffset()` returns minutes to ADD to local time to get UTC, i.e.
 * UTC+02:00 → -120. `Instant.offsetMinutes` uses the opposite, more intuitive
 * convention (UTC+02:00 → 120), so the sign is flipped here, at the boundary.
 */
export class SystemClock implements Clock {
  now(): Instant {
    const date = new Date()
    return {
      epochMs: date.getTime(),
      offsetMinutes: -date.getTimezoneOffset()
    }
  }
}
