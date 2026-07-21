// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
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

declare const hourBrand: unique symbol

/**
 * A wall-clock hour, guaranteed to be an integer in [0, 23].
 *
 * Branded on purpose: the only way to obtain one is `hourOfDay`, so every
 * consumer downstream (`salutationFor`) is *total* — it has no invalid input to
 * defend against, and therefore no error case to invent. Parse, don't validate.
 *
 * Why a `unique symbol` rather than the simpler `{ __brand: 'hour' }`:
 *  - a string-literal brand is structural, so two types that happen to use the
 *    same literal are the SAME type — one copy-pasted literal silently makes
 *    `HourOfDay` and, say, `DayOfMonth` interchangeable. A `unique symbol` is
 *    unique per declaration: collision is impossible, not merely unlikely.
 *  - `declare const` emits nothing, so no runtime value can satisfy the shape.
 *    `as` becomes the single, greppable way in — whereas a literal brand can be
 *    forged with no cast at all (`Object.assign(99, { __brand: 'hour' })`),
 *    which would hand `salutationFor` the invalid hour its type promises it
 *    will never see.
 */
export type HourOfDay = number & { readonly [hourBrand]: true }

const MS_PER_HOUR = 3_600_000
const MS_PER_MINUTE = 60_000
const HOURS_PER_DAY = 24

/** The local wall-clock hour of an instant. Total: every instant has one. */
export function hourOfDay(instant: Instant): HourOfDay {
  const localMs = instant.epochMs + instant.offsetMinutes * MS_PER_MINUTE
  const hours = Math.floor(localMs / MS_PER_HOUR)
  // `%` keeps the sign of its left operand in JS; shift back into [0, 23].
  const hour = ((hours % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY
  // The one cast in the domain, and the arithmetic above is what earns it —
  // `instant.spec.ts` pins the [0, 23] range as a property.
  return hour as HourOfDay
}
