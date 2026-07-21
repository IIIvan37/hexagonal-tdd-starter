import { describe, expect, it } from 'vitest'
import type { Clock, GreetingSink, NameSource } from '../application/ports.ts'
import type { Greeting } from '../domain/greeting.ts'
import { hourOfDay } from '../domain/instant.ts'

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

/** What a `Clock` implementation must provide to be contract-tested. */
export interface ClockSubject {
  readonly clock: Clock
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
 * Replay the `Clock` contract against one implementation.
 * `createSubject` must return a FRESH subject on every call.
 */
export function clockContract(
  label: string,
  createSubject: () => ClockSubject
): void {
  // The widest real-world UTC offsets: UTC-12:00 to UTC+14:00.
  const MIN_OFFSET_MINUTES = -720
  const MAX_OFFSET_MINUTES = 840

  describe(`${label} — Clock contract`, () => {
    it('reports a finite instant on the epoch timeline', () => {
      const { clock } = createSubject()
      const { epochMs } = clock.now()
      expect(Number.isFinite(epochMs)).toBe(true)
    })

    it('reports a whole-minute offset within the real range of timezones', () => {
      const { clock } = createSubject()
      const { offsetMinutes } = clock.now()
      expect(Number.isInteger(offsetMinutes)).toBe(true)
      expect(offsetMinutes).toBeGreaterThanOrEqual(MIN_OFFSET_MINUTES)
      expect(offsetMinutes).toBeLessThanOrEqual(MAX_OFFSET_MINUTES)
    })

    it('never runs backwards between two reads', () => {
      const { clock } = createSubject()
      const first = clock.now().epochMs
      const second = clock.now().epochMs
      expect(second).toBeGreaterThanOrEqual(first)
    })

    it('yields an instant the domain can read as a wall-clock hour', () => {
      const { clock } = createSubject()
      const hour = hourOfDay(clock.now())
      expect(hour).toBeGreaterThanOrEqual(0)
      expect(hour).toBeLessThanOrEqual(23)
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
