import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { buildGreeting } from './greeting.ts'

describe('buildGreeting', () => {
  it('addresses the recipient by name', () => {
    expect(buildGreeting('Ada')).toEqual({
      recipient: 'Ada',
      message: 'Hello, Ada!'
    })
  })

  it('trims surrounding whitespace', () => {
    expect(buildGreeting('  Ada  ').recipient).toBe('Ada')
  })

  it('rejects an empty (or whitespace-only) name', () => {
    expect(() => buildGreeting('   ')).toThrow(/empty/)
  })

  // Property test (fast-check): the message always contains the trimmed name.
  it('embeds the trimmed name in the message', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim() !== ''),
        (name) => {
          const greeting = buildGreeting(name)
          expect(greeting.message).toContain(greeting.recipient)
        }
      )
    )
  })
})
