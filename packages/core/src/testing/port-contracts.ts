import { describe, expect, it } from 'vitest'
import type { GreetingSink, NameSource } from '../application/ports.ts'
import type { Greeting } from '../domain/greeting.ts'

/**
 * Port **contract tests**: the obligations an adapter must honour, written once
 * against the interface and replayed against every implementation.
 *
 * A port is a promise the core makes to itself. A unit test of one adapter only
 * proves that adapter behaves; a contract proves every adapter is substitutable
 * — which is the whole point of the hexagon. When you add an adapter, you do not
 * write new port tests: you call the contract with a factory.
 *
 * The contract states behaviour the *core* depends on, and nothing more. Anything
 * specific to one adapter (argv parsing, stdout formatting) belongs in that
 * adapter's own spec, not here.
 */

/** What a `NameSource` implementation must provide to be contract-tested. */
export interface NameSourceSubject {
  readonly source: NameSource
  /** The name this subject is expected to load. */
  readonly expectedName: string
}

/** What a `GreetingSink` implementation must expose to be contract-tested. */
export interface GreetingSinkSubject {
  readonly sink: GreetingSink
  /** The messages that actually reached the destination, oldest first. */
  readonly emitted: () => readonly string[]
}

/**
 * Replay the `NameSource` contract against one implementation.
 * `createSubject` must return a FRESH subject on every call — the contract
 * relies on each case starting from a clean state.
 */
export function nameSourceContract(
  label: string,
  createSubject: () => NameSourceSubject
): void {
  describe(`${label} — NameSource contract`, () => {
    it('loads the name it was configured with', async () => {
      const { source, expectedName } = createSubject()
      await expect(source.load()).resolves.toBe(expectedName)
    })

    it('is a read, not a queue: loading twice yields the same name', async () => {
      const { source } = createSubject()
      const first = await source.load()
      const second = await source.load()
      expect(second).toBe(first)
    })
  })
}

/**
 * Replay the `GreetingSink` contract against one implementation.
 * `createSubject` must return a FRESH subject on every call.
 */
export function greetingSinkContract(
  label: string,
  createSubject: () => GreetingSinkSubject
): void {
  const greetingOf = (recipient: string): Greeting => ({
    recipient,
    message: `Hello, ${recipient}!`
  })

  describe(`${label} — GreetingSink contract`, () => {
    it('delivers the message of the greeting it is given', async () => {
      const { sink, emitted } = createSubject()
      await sink.save(greetingOf('Ada'))
      expect(emitted()).toEqual(['Hello, Ada!'])
    })

    it('delivers every greeting, in the order they were saved', async () => {
      const { sink, emitted } = createSubject()
      await sink.save(greetingOf('Ada'))
      await sink.save(greetingOf('Grace'))
      expect(emitted()).toEqual(['Hello, Ada!', 'Hello, Grace!'])
    })

    it('leaves the greeting it was given untouched', async () => {
      const { sink } = createSubject()
      const greeting = greetingOf('Ada')
      await sink.save(greeting)
      expect(greeting).toEqual(greetingOf('Ada'))
    })

    it('reports completion, so the use-case can await delivery', async () => {
      const { sink } = createSubject()
      await expect(sink.save(greetingOf('Ada'))).resolves.toBeUndefined()
    })
  })
}
