import type { GreetingSink, NameSource } from '../application/ports.ts'
import type { Greeting } from '../domain/greeting.ts'

/**
 * Reference in-memory implementations of the ports. They exist for two reasons:
 * they are the fakes every use-case test needs, and they are the subject the
 * port contracts are validated against — so a contract that the reference
 * implementation fails is a bug in the contract, not in an adapter.
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
