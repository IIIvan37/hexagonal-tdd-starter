// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { hourOfDay } from './instant.ts'

const HOUR_MS = 3_600_000

describe('hourOfDay', () => {
  it('reads midnight UTC as hour 0', () => {
    expect(hourOfDay({ epochMs: 0, offsetMinutes: 0 })).toBe(0)
  })

  it('reads a UTC wall-clock hour', () => {
    expect(hourOfDay({ epochMs: 9 * HOUR_MS, offsetMinutes: 0 })).toBe(9)
  })

  it('applies a positive offset (east of UTC)', () => {
    // 09:00 UTC seen from UTC+02:00 is 11:00 local.
    expect(hourOfDay({ epochMs: 9 * HOUR_MS, offsetMinutes: 120 })).toBe(11)
  })

  it('applies a negative offset (west of UTC)', () => {
    // 09:00 UTC seen from UTC-05:00 is 04:00 local.
    expect(hourOfDay({ epochMs: 9 * HOUR_MS, offsetMinutes: -300 })).toBe(4)
  })

  it('wraps backwards across midnight', () => {
    // 01:00 UTC seen from UTC-05:00 is 20:00 the previous day.
    expect(hourOfDay({ epochMs: 1 * HOUR_MS, offsetMinutes: -300 })).toBe(20)
  })

  it('wraps forwards across midnight', () => {
    // 23:00 UTC seen from UTC+02:00 is 01:00 the next day.
    expect(hourOfDay({ epochMs: 23 * HOUR_MS, offsetMinutes: 120 })).toBe(1)
  })

  it('handles a fractional offset (UTC+05:45, Nepal)', () => {
    expect(hourOfDay({ epochMs: 9 * HOUR_MS, offsetMinutes: 345 })).toBe(14)
  })

  // Property: whatever the instant, the local hour is a valid clock hour.
  it('always yields an hour in [0, 23]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -8.64e15, max: 8.64e15 }),
        fc.integer({ min: -840, max: 840 }),
        (epochMs, offsetMinutes) => {
          const hour = hourOfDay({ epochMs, offsetMinutes })
          expect(Number.isInteger(hour)).toBe(true)
          expect(hour).toBeGreaterThanOrEqual(0)
          expect(hour).toBeLessThanOrEqual(23)
        }
      )
    )
  })

  // Property: the hour advances with the clock, modulo the 24h cycle.
  it('advances by one for every hour elapsed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e12, max: 1e12 }),
        fc.integer({ min: -840, max: 840 }),
        (epochMs, offsetMinutes) => {
          const now = hourOfDay({ epochMs, offsetMinutes })
          const later = hourOfDay({ epochMs: epochMs + HOUR_MS, offsetMinutes })
          expect(later).toBe((now + 1) % 24)
        }
      )
    )
  })
})
