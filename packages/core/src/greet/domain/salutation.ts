// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import type { HourOfDay } from './instant.ts'

/** How the greeting opens, decided by the local wall-clock hour. */
export type Salutation = 'Good morning' | 'Good afternoon' | 'Good evening'

const MORNING_STARTS_AT = 5
const AFTERNOON_STARTS_AT = 12
const EVENING_STARTS_AT = 18

/**
 * Pure and **total**: every `HourOfDay` maps to a salutation, so there is no
 * error branch to write here and none for the caller to handle.
 *
 * That totality is bought by the type, not by a runtime check: `HourOfDay` can
 * only be produced by `hourOfDay`, which guarantees an integer in [0, 23]. The
 * defensive `if (hour < 0 || hour > 23) throw` this function used to open with
 * was untestable through the real call path — dead code standing in for a type.
 */
export function salutationFor(hour: HourOfDay): Salutation {
  if (hour < MORNING_STARTS_AT) {
    return 'Good evening'
  }
  if (hour < AFTERNOON_STARTS_AT) {
    return 'Good morning'
  }
  if (hour < EVENING_STARTS_AT) {
    return 'Good afternoon'
  }
  return 'Good evening'
}
