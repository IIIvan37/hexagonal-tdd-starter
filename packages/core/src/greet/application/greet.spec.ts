// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import { describe, expect, it } from 'vitest'
import {
  FailingNameSource,
  FixedClock,
  InMemoryGreetingSink,
  InMemoryNameSource
} from '../testing/in-memory-adapters.ts'
import { greet } from './greet.ts'

// 09:00 UTC — the time is pinned, so these tests read the same at any hour.
const atNineAm = new FixedClock({ epochMs: 9 * 3_600_000, offsetMinutes: 0 })

describe('greet — when the source provides a name', () => {
  const source = new InMemoryNameSource('Ada')

  it('returns an ok Result with the recipient', async () => {
    const result = await greet({
      source,
      sink: new InMemoryGreetingSink(),
      clock: atNineAm
    })
    expect(result).toEqual({ ok: true, value: { recipient: 'Ada' } })
  })

  it('emits the greeting through the sink port', async () => {
    const sink = new InMemoryGreetingSink()
    await greet({ source, sink, clock: atNineAm })
    expect(sink.last()?.message).toBe('Good morning, Ada!')
  })

  it('lets the clock decide the salutation', async () => {
    const sink = new InMemoryGreetingSink()
    const atNight = new FixedClock({
      epochMs: 21 * 3_600_000,
      offsetMinutes: 0
    })
    await greet({ source, sink, clock: atNight })
    expect(sink.last()?.message).toBe('Good evening, Ada!')
  })

  it('reads the clock through the port, honouring its offset', async () => {
    const sink = new InMemoryGreetingSink()
    // 23:00 UTC is 01:00 the next day in UTC+02:00 — still the evening greeting.
    await greet({
      source,
      sink,
      clock: new FixedClock({ epochMs: 23 * 3_600_000, offsetMinutes: 120 })
    })
    expect(sink.last()?.message).toBe('Good evening, Ada!')
  })
})

describe('greet — when the input is invalid or a port fails', () => {
  it('surfaces a domain error by its tag, not by a message', async () => {
    const result = await greet({
      source: new InMemoryNameSource('   '),
      sink: new InMemoryGreetingSink(),
      clock: atNineAm
    })
    expect(result).toEqual({ ok: false, error: { kind: 'empty-name' } })
  })

  it('emits nothing when the greeting cannot be built', async () => {
    const sink = new InMemoryGreetingSink()
    await greet({
      source: new InMemoryNameSource('   '),
      sink,
      clock: atNineAm
    })
    expect(sink.saved()).toEqual([])
  })

  it('tags a failing source distinctly, keeping the cause', async () => {
    const result = await greet({
      source: new FailingNameSource('no input'),
      sink: new InMemoryGreetingSink(),
      clock: atNineAm
    })
    expect(result).toEqual({
      ok: false,
      error: { kind: 'source-unavailable', cause: 'no input' }
    })
  })

  it('tags a failing sink distinctly, keeping the cause', async () => {
    const result = await greet({
      source: new InMemoryNameSource('Ada'),
      sink: {
        save: () => Promise.reject(new Error('stdout closed'))
      },
      clock: atNineAm
    })
    expect(result).toEqual({
      ok: false,
      error: { kind: 'sink-unavailable', cause: 'stdout closed' }
    })
  })

  it('describes a rejected non-Error value', async () => {
    const result = await greet({
      source: { load: () => Promise.reject('plain failure') },
      sink: new InMemoryGreetingSink(),
      clock: atNineAm
    })
    expect(result).toEqual({
      ok: false,
      error: { kind: 'source-unavailable', cause: 'plain failure' }
    })
  })

  it('lets a programming error crash instead of disguising it as a Result', async () => {
    // The old blanket try/catch turned this TypeError into a polite
    // `{ ok: false }`, indistinguishable from a business rule. It must escape.
    const brokenClock = {
      now: () => {
        throw new TypeError('clock is broken')
      }
    }
    await expect(
      greet({
        source: new InMemoryNameSource('Ada'),
        sink: new InMemoryGreetingSink(),
        clock: brokenClock
      })
    ).rejects.toThrow(TypeError)
  })
})
