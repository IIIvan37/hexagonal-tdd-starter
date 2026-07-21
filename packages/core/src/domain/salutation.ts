/** How the greeting opens, decided by the local wall-clock hour. */
export type Salutation = 'Good morning' | 'Good afternoon' | 'Good evening'

const MORNING_STARTS_AT = 5
const AFTERNOON_STARTS_AT = 12
const EVENING_STARTS_AT = 18

/** Pure: a wall-clock hour in [0, 23] in, a salutation out. */
export function salutationFor(hour: number): Salutation {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`hour must be an integer in [0, 23], got ${hour}`)
  }
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
