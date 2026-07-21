import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { buildGreeting } from './greeting.ts'
import type { Salutation } from './salutation.ts'

const anySalutation = fc.constantFrom<Salutation>(
  'Good morning',
  'Good afternoon',
  'Good evening'
)

describe('buildGreeting', () => {
  it('addresses the recipient with the given salutation', () => {
    expect(buildGreeting('Ada', 'Good morning')).toEqual({
      recipient: 'Ada',
      message: 'Good morning, Ada!'
    })
  })

  it('carries whichever salutation the clock dictated', () => {
    expect(buildGreeting('Ada', 'Good evening').message).toBe(
      'Good evening, Ada!'
    )
  })

  it('trims surrounding whitespace', () => {
    expect(buildGreeting('  Ada  ', 'Good morning').recipient).toBe('Ada')
  })

  it('rejects an empty (or whitespace-only) name', () => {
    expect(() => buildGreeting('   ', 'Good morning')).toThrow(/empty/)
  })

  // Property test (fast-check): the message always contains the trimmed name.
  it('embeds the trimmed name in the message', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim() !== ''),
        anySalutation,
        (name, salutation) => {
          const greeting = buildGreeting(name, salutation)
          expect(greeting.message).toContain(greeting.recipient)
        }
      )
    )
  })

  // Property test: the message always opens with the salutation it was given.
  it('opens with the salutation it was given', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim() !== ''),
        anySalutation,
        (name, salutation) => {
          expect(
            buildGreeting(name, salutation).message.startsWith(salutation)
          ).toBe(true)
        }
      )
    )
  })
})
