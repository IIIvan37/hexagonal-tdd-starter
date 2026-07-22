// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { buildGreeting } from './greeting.ts'
import type { Salutation } from './salutation.ts'

const anySalutation = fc.constantFrom<Salutation>(
  'Good morning',
  'Good afternoon',
  'Good evening'
)

/** Unwrap a Result the test asserts is a success. */
function greetingOf(name: string, salutation: Salutation) {
  const result = buildGreeting(name, salutation)
  if (!result.ok) {
    throw new Error(`expected a greeting, got ${result.error.kind}`)
  }
  return result.value
}

describe('buildGreeting', () => {
  it('addresses the recipient with the given salutation', () => {
    expect(buildGreeting('Ada', 'Good morning')).toEqual({
      ok: true,
      value: { recipient: 'Ada', message: 'Good morning, Ada!' }
    })
  })

  it('carries whichever salutation the clock dictated', () => {
    expect(greetingOf('Ada', 'Good evening').message).toBe('Good evening, Ada!')
  })

  it('trims surrounding whitespace', () => {
    expect(greetingOf('  Ada  ', 'Good morning').recipient).toBe('Ada')
  })

  it('rejects an empty (or whitespace-only) name as a value, not an exception', () => {
    expect(buildGreeting('   ', 'Good morning')).toEqual({
      ok: false,
      error: { kind: 'empty-name' }
    })
  })

  it('rejects an empty name whatever the whitespace', () => {
    for (const blank of ['', ' ', '\t', '\n', '   \t\n  ']) {
      expect(buildGreeting(blank, 'Good morning').ok).toBe(false)
    }
  })

  // Property test (fast-check): the message always contains the trimmed name.
  it('embeds the trimmed name in the message', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim() !== ''),
        anySalutation,
        (name, salutation) => {
          const greeting = greetingOf(name, salutation)
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
            greetingOf(name, salutation).message.startsWith(salutation)
          ).toBe(true)
        }
      )
    )
  })
})
