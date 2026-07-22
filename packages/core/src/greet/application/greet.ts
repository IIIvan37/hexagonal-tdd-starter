// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".

import { err, ok, type Result } from '../../shared/result.ts'
import { buildGreeting, type GreetingError } from '../domain/greeting.ts'
import { hourOfDay } from '../domain/instant.ts'
import { salutationFor } from '../domain/salutation.ts'
import type { Clock, GreetingSink, NameSource } from './ports.ts'

export interface GreetDeps {
  readonly source: NameSource
  readonly sink: GreetingSink
  readonly clock: Clock
}

/**
 * Everything that can go wrong, as a closed set of tags.
 *
 * A tag, not a sentence: the core does not decide how a failure is worded, which
 * exit code it deserves or what language the user reads. That is presentation,
 * and it belongs to the adapter (`cli/src/run.ts`). It also means adding a case
 * here makes every consumer fail to compile until it is handled — which is the
 * point of an exhaustive union.
 */
export type GreetError =
  | GreetingError
  | { readonly kind: 'source-unavailable'; readonly cause: string }
  | { readonly kind: 'sink-unavailable'; readonly cause: string }

export type GreetResult = Result<{ readonly recipient: string }, GreetError>

/** Describe a thrown value without assuming it is an `Error`. (Not `describe` —
 * that name belongs to vitest in every reader's head.) */
function describeThrown(thrown: unknown): string {
  return thrown instanceof Error ? thrown.message : String(thrown)
}

/**
 * Orchestration use-case, pure: load via the source port, read the time via the
 * clock port, decide and build the greeting in the domain, emit via the sink
 * port. No I/O here — everything arrives through `deps`.
 *
 * Note the two NARROW `try`s. Adapters live outside the hexagon and may throw
 * for reasons the core cannot enumerate, so each port call is wrapped where it
 * happens and mapped to its own tag. What this deliberately no longer does is
 * wrap the whole body: that swallowed genuine programming errors — a TypeError
 * in the domain came back as a polite `{ ok: false }` and looked like a business
 * rule. A bug must crash loudly; only expected failures are values.
 */
export async function greet(deps: GreetDeps): Promise<GreetResult> {
  let name: string
  try {
    name = await deps.source.load()
  } catch (thrown) {
    return err({ kind: 'source-unavailable', cause: describeThrown(thrown) })
  }

  const salutation = salutationFor(hourOfDay(deps.clock.now()))
  const greeting = buildGreeting(name, salutation)
  if (!greeting.ok) {
    return greeting
  }

  try {
    await deps.sink.save(greeting.value)
  } catch (thrown) {
    return err({ kind: 'sink-unavailable', cause: describeThrown(thrown) })
  }

  return ok({ recipient: greeting.value.recipient })
}
