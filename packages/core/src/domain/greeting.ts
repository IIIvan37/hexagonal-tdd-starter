import type { Salutation } from './salutation.ts'

/**
 * Minimal pure domain. This is the center of the hexagon: no I/O, no framework,
 * no environment — a value in, a value out. Replace it with your own model and
 * let a use-case (application/) pull more domain into existence (TDD, outside-in).
 */
export interface Greeting {
  readonly recipient: string
  readonly message: string
}

/**
 * Pure: a name and a salutation in, a greeting out. Trims, and rejects an empty
 * name.
 *
 * Note what is NOT here: deciding *which* salutation applies needs the current
 * time, and reading a clock is I/O. The caller passes the salutation in — see
 * `salutationFor` (pure) and the `Clock` port (impure, adapter-side).
 */
export function buildGreeting(name: string, salutation: Salutation): Greeting {
  const recipient = name.trim()
  if (recipient === '') {
    throw new Error('name must not be empty')
  }
  return { recipient, message: `${salutation}, ${recipient}!` }
}
