import { describe, expect, it } from 'vitest'
import type { Greeting } from '../domain/greeting.ts'
import { greet } from './greet.ts'
import type { GreetingSink, NameSource } from './ports.ts'

class CapturingSink implements GreetingSink {
  saved: Greeting | undefined
  async save(greeting: Greeting): Promise<void> {
    this.saved = greeting
  }
}

describe('greet — when the source provides a name', () => {
  const source: NameSource = { load: async () => 'Ada' }

  it('returns an ok Result with the recipient', async () => {
    const result = await greet({ source, sink: new CapturingSink() })
    expect(result).toEqual({ ok: true, recipient: 'Ada' })
  })

  it('emits the greeting through the sink port', async () => {
    const sink = new CapturingSink()
    await greet({ source, sink })
    expect(sink.saved?.message).toBe('Hello, Ada!')
  })
})

describe('greet — when the input is invalid or the source fails', () => {
  it('turns a domain error into a typed Result', async () => {
    const result = await greet({
      source: { load: async () => '   ' },
      sink: new CapturingSink()
    })
    expect(result).toEqual({ ok: false, error: 'name must not be empty' })
  })

  it('reports a source failure as a typed error', async () => {
    const result = await greet({
      source: {
        load: async () => {
          throw new Error('no input')
        }
      },
      sink: new CapturingSink()
    })
    expect(result).toEqual({ ok: false, error: 'no input' })
  })

  it('stringifies a rejected non-Error value', async () => {
    const result = await greet({
      source: { load: () => Promise.reject('plain failure') },
      sink: new CapturingSink()
    })
    expect(result).toEqual({ ok: false, error: 'plain failure' })
  })
})
