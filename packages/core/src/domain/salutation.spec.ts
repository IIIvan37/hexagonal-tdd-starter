import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { salutationFor } from './salutation.ts'

describe('salutationFor', () => {
  it.each([
    [0, 'Good evening'],
    [4, 'Good evening'],
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [17, 'Good afternoon'],
    [18, 'Good evening'],
    [23, 'Good evening']
  ])('greets hour %i with "%s"', (hour, expected) => {
    expect(salutationFor(hour)).toBe(expected)
  })

  it('rejects an hour outside the clock', () => {
    expect(() => salutationFor(24)).toThrow(/hour/)
    expect(() => salutationFor(-1)).toThrow(/hour/)
  })

  it('rejects a fractional hour', () => {
    expect(() => salutationFor(9.5)).toThrow(/hour/)
  })

  // Property: every valid hour maps to one of the three salutations.
  it('always yields a known salutation for a valid hour', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(
          salutationFor(hour)
        )
      })
    )
  })
})
