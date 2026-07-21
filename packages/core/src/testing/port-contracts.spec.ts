import { describe, expect, it } from 'vitest'
import {
  FailingNameSource,
  FixedClock,
  InMemoryGreetingSink,
  InMemoryNameSource
} from './in-memory-adapters.ts'
import {
  clockContract,
  greetingSinkContract,
  nameSourceContract
} from './port-contracts.ts'

// The in-memory adapters are the reference implementations: if they fail the
// contract, the contract is wrong. Every real adapter replays these same suites.
nameSourceContract('InMemoryNameSource', () => ({
  source: new InMemoryNameSource('Ada'),
  expectedName: 'Ada'
}))

clockContract('FixedClock', () => ({
  clock: new FixedClock({ epochMs: 9 * 3_600_000, offsetMinutes: 120 })
}))

greetingSinkContract('InMemoryGreetingSink', () => {
  const sink = new InMemoryGreetingSink()
  return { sink, emitted: () => sink.saved().map((g) => g.message) }
})

describe('InMemoryGreetingSink — beyond the contract', () => {
  it('exposes the most recent greeting', async () => {
    const sink = new InMemoryGreetingSink()
    expect(sink.last()).toBeUndefined()

    await sink.save({ recipient: 'Ada', message: 'Hello, Ada!' })
    await sink.save({ recipient: 'Grace', message: 'Hello, Grace!' })

    expect(sink.last()?.recipient).toBe('Grace')
  })
})

describe('FailingNameSource', () => {
  it('rejects with the configured reason', async () => {
    const source = new FailingNameSource('no input')
    await expect(source.load()).rejects.toThrow('no input')
  })
})
