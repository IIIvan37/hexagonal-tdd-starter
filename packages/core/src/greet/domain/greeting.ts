// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import { err, ok, type Result } from '../../shared/result.ts'
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

/** Why a name could not become a greeting. A closed set, so callers can be exhaustive. */
export type GreetingError = { readonly kind: 'empty-name' }

/**
 * Pure: a name and a salutation in, a greeting out. Trims, and rejects an empty
 * name — as a `Result`, not an exception. An empty name is untrusted input
 * failing to parse, which is an ordinary outcome, not an emergency; and the
 * error is a *tag*, not a sentence, so the adapter owns the wording (and the
 * language).
 *
 * Note what is NOT here: deciding *which* salutation applies needs the current
 * time, and reading a clock is I/O. The caller passes the salutation in — see
 * `salutationFor` (pure) and the `Clock` port (impure, adapter-side).
 */
export function buildGreeting(
  name: string,
  salutation: Salutation
): Result<Greeting, GreetingError> {
  const recipient = name.trim()
  if (recipient === '') {
    return err({ kind: 'empty-name' })
  }
  return ok({ recipient, message: `${salutation}, ${recipient}!` })
}
