import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  filesUnder,
  normalized,
  packageRoots
} from '../../../scripts/source-tree.ts'

/**
 * Design fitness function for CLOSED VARIANT SETS — the shotgun-surgery
 * family the compiler cannot see on its own. Distilled from a field
 * project's SOLID review (the OCP findings all had the same shape: a literal
 * union hand-copied across files, so adding one variant meant editing ~10
 * sites, one of which failed silently).
 *
 * 1. **Closed vocabulary.** A registered literal set is SPELLED OUT in one
 *    owner module; any other file quoting the whole set is a re-declaration
 *    waiting to drift — compose the owner's exported type instead. Record
 *    keys stay unquoted, so exhaustive lookup tables never trip this.
 *    Register a vocabulary the day a union crosses a module boundary.
 * 2. **No hand-written membership chains.** `x === 'a' || x === 'b' || …`
 *    (3+ literals) re-enumerates a union outside the compiler's sight — a
 *    new variant compiles clean and the chain silently misses it. Derive
 *    from a `Record<Union, …>` table or a type-guard predicate. Pinned at 0.
 */

interface Vocabulary {
  readonly name: string
  readonly literals: readonly string[]
  /** The one module allowed to spell the whole set (path suffix). */
  readonly owner: string
  /** Sorted path suffixes where full co-quotation is justified — each entry
   * must stay compiler-tied to the owner's type (say how in a comment). */
  readonly allowed: readonly string[]
}

// Example (from the field project that bred this spec):
//   { name: 'analysis transport error codes',
//     literals: ['engine-unavailable', 'network', 'timeout', 'too-large'],
//     owner: 'core/src/shared/analysis-transport.ts',
//     allowed: ['web/src/audio/http/post-wav-json.ts'] }
const VOCABULARIES: readonly Vocabulary[] = []

/** 3+ same-subject literal equality chain — spanning lines. */
const MEMBERSHIP_CHAIN =
  /([\w.]+)\s*===\s*'[^']+'(?:\s*\|\|\s*\1\s*===\s*'[^']+'){2,}/g

/** Blank comments, keeping line numbers — prose may quote a literal set. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => (/^\s*(\/\/|\*)/.test(line) ? '' : line))
    .join('\n')
}

function quotesWholeSet(source: string, literals: readonly string[]): boolean {
  const code = codeOnly(source)
  return literals.every((literal) => code.includes(`'${literal}'`))
}

function membershipChains(source: string, path: string): readonly string[] {
  return [...codeOnly(source).matchAll(MEMBERSHIP_CHAIN)].map(
    (match) => `  ${path} — ${match[0].replace(/\s+/g, ' ').slice(0, 100)}`
  )
}

/** Production `.ts`/`.tsx` under a root: no specs, no ambient declarations. */
const productionSources = (dir: string): readonly string[] =>
  filesUnder(
    dir,
    (_path, name) =>
      /\.tsx?$/.test(name) && !/\.spec\.tsx?$|\.d\.ts$/.test(name)
  )

describe('the detectors themselves', () => {
  it('sees a whole set quoted, ignoring comments and record keys', () => {
    expect(
      quotesWholeSet("type X = 'a' | 'b'\nconst t = { a: 1, b: 2 }", ['a', 'b'])
    ).toBe(true)
    expect(
      quotesWholeSet("// the set 'a' | 'b'\nconst x = 'a'", ['a', 'b'])
    ).toBe(false)
  })

  it.each([
    "s === 'a' || s === 'b' || s === 'c'",
    "state.kind === 'x' ||\n  state.kind === 'y' ||\n  state.kind === 'z'"
  ])('flags the 3-literal chain %j', (source) => {
    expect(membershipChains(source, 'x.ts')).toHaveLength(1)
  })

  it.each([
    "s === 'a' || s === 'b'",
    "a === 'x' || b === 'y' || c === 'z'",
    "// s === 'a' || s === 'b' || s === 'c'"
  ])('leaves %j alone (two literals, mixed subjects, prose)', (source) => {
    expect(membershipChains(source, 'x.ts')).toEqual([])
  })
})

describe('variant discipline over every package', () => {
  const sources = packageRoots().flatMap((root) => productionSources(root))

  it('finds sources to scan (a silent empty scan proves nothing)', () => {
    expect(sources.length).toBeGreaterThan(5)
  })

  it('keeps every registered vocabulary spelled out only by its owner', () => {
    for (const { literals, owner, allowed } of VOCABULARIES) {
      const offenders = sources
        .filter((path) => {
          const p = normalized(path)
          return ![owner, ...allowed].some((suffix) => p.endsWith(suffix))
        })
        .filter((path) => quotesWholeSet(readFileSync(path, 'utf8'), literals))
      expect(
        offenders,
        `\nthe whole set [${literals.join(', ')}] is re-spelled outside ${owner}:` +
          `\n${offenders.map((o) => `  ${o}`).join('\n')}` +
          `\nCompose the owner's exported type instead of re-declaring the union.`
      ).toEqual([])
    }
  })

  it('never hand-writes a 3-literal membership chain (derive from the union)', () => {
    const chains = sources.flatMap((path) =>
      membershipChains(readFileSync(path, 'utf8'), path)
    )
    expect(
      chains,
      `\nhand-written membership chain(s) — a new variant compiles clean and is` +
        `\nsilently missed; use a Record<Union, …> table or a type-guard predicate:` +
        `\n${chains.join('\n')}`
    ).toEqual([])
  })
})
