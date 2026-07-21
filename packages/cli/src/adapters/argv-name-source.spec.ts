// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import { nameSourceContract } from '@app/core/testing'
import { describe, expect, it } from 'vitest'
import { ArgvNameSource } from './argv-name-source.ts'

// The port obligations, replayed — no bespoke port tests to write here.
nameSourceContract('ArgvNameSource', () => ({
  source: new ArgvNameSource('Ada'),
  expectedName: 'Ada'
}))

// Adapter-specific behaviour: what makes THIS implementation different.
describe('ArgvNameSource — argv specifics', () => {
  it('passes the raw argument through, trimming left to the domain', async () => {
    await expect(new ArgvNameSource('  Ada  ').load()).resolves.toBe('  Ada  ')
  })
})
