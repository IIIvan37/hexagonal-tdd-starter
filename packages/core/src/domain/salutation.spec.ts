import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { hourOfDay } from './instant.ts'
import { salutationFor } from './salutation.ts'

// The ONLY way to get an `HourOfDay` is to parse an instant — which is the point
// of the brand. A test cannot fabricate an out-of-range hour, and neither can
// production code.
const at = (hour: number) =>
  hourOfDay({ epochMs: hour * 3_600_000, offsetMinutes: 0 })

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
    expect(salutationFor(at(hour))).toBe(expected)
  })

  // Property: every hour of the clock maps to a salutation. Totality, checked.
  it('is total over the whole clock', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(
          salutationFor(at(hour))
        )
      })
    )
  })
})
