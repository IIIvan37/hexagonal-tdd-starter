// EXAMPLE CONTENT, SKELETON ROLE — keep this file, rewrite its contents for your slice. See README "Anatomy".
import type { GreetError } from '@app/core'

/** Exit codes, as a CLI convention — a presentation concern, not a domain one. */
export const EXIT_OK = 0
export const EXIT_MISUSE = 2
export const EXIT_UNAVAILABLE = 69 // sysexits.h EX_UNAVAILABLE

export interface Report {
  readonly message: string
  readonly code: number
}

/** Compile-time proof that every `GreetError` tag is handled below. */
function exhausted(error: never): never {
  throw new Error(`unhandled GreetError: ${JSON.stringify(error)}`)
}

/**
 * Turn a domain error tag into something a human reads and a shell can branch on.
 *
 * This is the payoff of tagging errors instead of passing strings around: the
 * wording, the language and the exit code are decided HERE, by the adapter that
 * knows it is a CLI. A different adapter (HTTP, GUI) maps the same tags to a
 * status code or a toast, and the core never learns about either.
 *
 * `exhausted` makes the switch total: adding a tag to `GreetError` breaks this
 * build until it is handled, instead of silently falling through to a default.
 */
export function report(error: GreetError): Report {
  switch (error.kind) {
    case 'empty-name':
      return { message: 'a name is required', code: EXIT_MISUSE }
    case 'source-unavailable':
      return {
        message: `could not read the name: ${error.cause}`,
        code: EXIT_UNAVAILABLE
      }
    case 'sink-unavailable':
      return {
        message: `could not emit the greeting: ${error.cause}`,
        code: EXIT_UNAVAILABLE
      }
    default:
      return exhausted(error)
  }
}
