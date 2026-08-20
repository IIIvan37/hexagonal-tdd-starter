import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { filesUnder, packageRoots } from '../../../scripts/source-tree.ts'

/**
 * Design fitness function for ADR POINTERS. In the field project's SOLID
 * review, every refuted finding fell to the same defence: a decision
 * CONSIGNED at the point of friction (an `ADR NNNN` comment, a module
 * docstring) — and every confirmed one had none. The judgment cannot be
 * mechanised; the pointer's integrity can: every `ADR NNNN` referenced from
 * a source comment must resolve to a real record under docs/adr/, so a
 * renumbered or deleted ADR cannot leave silent dangling defences.
 */

const ADR_REF = /\bADR[- ](\d{4})\b/g

const sources = (dir: string): readonly string[] =>
  filesUnder(dir, (_path, name) => /\.tsx?$/.test(name))

const adrRoot = fileURLToPath(new URL('../../../docs/adr', import.meta.url))

describe('ADR pointers over every package', () => {
  const known = new Set(
    readdirSync(adrRoot)
      .map((name) => /^(\d{4})-/.exec(name)?.[1])
      .filter((id): id is string => id !== undefined)
  )

  it('finds recorded ADRs (a silent empty scan proves nothing)', () => {
    expect(known.size).toBeGreaterThanOrEqual(1)
  })

  it('resolves every ADR reference to a recorded decision', () => {
    const files = packageRoots().flatMap((root) => sources(root))
    const dangling = files.flatMap((path) =>
      [...readFileSync(path, 'utf8').matchAll(ADR_REF)]
        .map((match) => match[1] as string)
        .filter((id) => !known.has(id))
        .map((id) => `  ${path} → ADR ${id}`)
    )
    expect(
      dangling,
      `\nADR reference(s) with no record under docs/adr/:` +
        `\n${dangling.join('\n')}` +
        `\nA pointer to a missing decision is a defence that no longer exists —` +
        `\nrestore the record or rewrite the comment.`
    ).toEqual([])
  })
})
