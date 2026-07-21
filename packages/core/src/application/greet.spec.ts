import { describe, expect, it } from 'vitest'
import {
  FailingNameSource,
  InMemoryGreetingSink,
  InMemoryNameSource
} from '../testing/index.ts'
import { greet } from './greet.ts'

describe('greet — when the source provides a name', () => {
  const source = new InMemoryNameSource('Ada')

  it('returns an ok Result with the recipient', async () => {
    const result = await greet({ source, sink: new InMemoryGreetingSink() })
    expect(result).toEqual({ ok: true, recipient: 'Ada' })
  })

  it('emits the greeting through the sink port', async () => {
    const sink = new InMemoryGreetingSink()
    await greet({ source, sink })
    expect(sink.last()?.message).toBe('Hello, Ada!')
  })
})

describe('greet — when the input is invalid or the source fails', () => {
  it('turns a domain error into a typed Result', async () => {
    const result = await greet({
      source: new InMemoryNameSource('   '),
      sink: new InMemoryGreetingSink()
    })
    expect(result).toEqual({ ok: false, error: 'name must not be empty' })
  })

  it('reports a source failure as a typed error', async () => {
    const result = await greet({
      source: new FailingNameSource('no input'),
      sink: new InMemoryGreetingSink()
    })
    expect(result).toEqual({ ok: false, error: 'no input' })
  })

  it('stringifies a rejected non-Error value', async () => {
    const result = await greet({
      source: { load: () => Promise.reject('plain failure') },
      sink: new InMemoryGreetingSink()
    })
    expect(result).toEqual({ ok: false, error: 'plain failure' })
  })

  it('emits nothing when the greeting cannot be built', async () => {
    const sink = new InMemoryGreetingSink()
    await greet({ source: new InMemoryNameSource('   '), sink })
    expect(sink.saved()).toEqual([])
  })
})
