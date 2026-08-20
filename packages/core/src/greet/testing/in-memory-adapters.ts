// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import type { Clock, GreetingSink, NameSource } from '../application/ports.ts'
import type { Greeting } from '../domain/greeting.ts'
import type { Instant } from '../domain/instant.ts'

/**
 * Reference in-memory implementations of the ports. They exist for two reasons:
 * they are the fakes every use-case test needs, and they are the subject the
 * port contracts are validated against — so a contract that the reference
 * implementation fails is a bug in the contract, not in an adapter.
 *
 * These two async fakes settle instantly, which ADR 0008 rejects for a port
 * whose seam is real: a test cannot open the window where the load is in
 * flight. It is deliberate here and nowhere else — `greet` is a one-shot CLI
 * with one adapter per port, so a controllable fake would be a supplier with no
 * consumer. Copy the SHAPE of these fakes, not their settlement: the moment
 * your port has a second real adapter, `fake-fidelity.spec.ts` will say so.
 */

/** In-memory `NameSource`: hands back the name it was built with. */
export class InMemoryNameSource implements NameSource {
  private readonly name: string

  constructor(name: string) {
    this.name = name
  }

  async load(): Promise<string> {
    return this.name
  }
}

/** `NameSource` that always fails — the unhappy path, without a real adapter. */
export class FailingNameSource implements NameSource {
  private readonly reason: string

  constructor(reason: string) {
    this.reason = reason
  }

  async load(): Promise<string> {
    throw new Error(this.reason)
  }
}

/**
 * `Clock` pinned to one instant — the whole point of the port. A test that needs
 * "9am" says so, instead of hoping CI runs in the morning.
 */
export class FixedClock implements Clock {
  private readonly instant: Instant

  constructor(instant: Instant) {
    this.instant = instant
  }

  now(): Instant {
    return this.instant
  }
}

/** In-memory `GreetingSink`: records what it was given, in order. */
export class InMemoryGreetingSink implements GreetingSink {
  private readonly greetings: Greeting[] = []

  async save(greeting: Greeting): Promise<void> {
    this.greetings.push(greeting)
  }

  /** Everything saved so far, oldest first. */
  saved(): readonly Greeting[] {
    return this.greetings
  }

  /** The most recent greeting, or `undefined` if nothing was saved. */
  last(): Greeting | undefined {
    return this.greetings.at(-1)
  }
}
