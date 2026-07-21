/**
 * A point in time, as the domain needs it: an epoch offset plus the shift that
 * turns it into a wall clock. Both are plain numbers on purpose.
 *
 * Reading the clock and knowing the machine's timezone are impure — that is an
 * adapter's job (`SystemClock`), behind the `Clock` port. Everything the domain
 * does with a time is arithmetic, and stays pure and property-testable.
 */
export interface Instant {
  /** Milliseconds since the Unix epoch, UTC. */
  readonly epochMs: number
  /** Minutes to add to UTC to get local time (UTC+02:00 → 120, UTC-05:00 → -300). */
  readonly offsetMinutes: number
}

const MS_PER_HOUR = 3_600_000
const MS_PER_MINUTE = 60_000
const HOURS_PER_DAY = 24

/** The local wall-clock hour of an instant, in [0, 23]. */
export function hourOfDay(instant: Instant): number {
  const localMs = instant.epochMs + instant.offsetMinutes * MS_PER_MINUTE
  const hours = Math.floor(localMs / MS_PER_HOUR)
  // `%` keeps the sign of its left operand in JS; shift back into [0, 23].
  return ((hours % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY
}
