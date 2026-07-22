import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Architecture fitness function: the pure core must not reach for ambient state.
 *
 * Biome guards the *globals* (`Date`, `process`, `fetch`) and the *imports*
 * (`node:fs`, `node:http`) — see the `packages/core` override in `biome.json`.
 * What it structurally cannot express is a member expression on an otherwise
 * legitimate global: `Math` is fine, `Math.random()` is not. That gap is the one
 * this test closes, and it is the gap that matters most — non-determinism is the
 * impurity that silently makes a domain untestable.
 *
 * Add a rule here whenever a new source of ambient state shows up. The fix is
 * never to widen the rule: it is to inject a port, the way `Clock` replaced the
 * urge to call `Date.now()`.
 */

interface ForbiddenPattern {
  readonly pattern: RegExp
  readonly why: string
}

// A REFERENCE is enough to be impure (`const f = Date.now` smuggles the same
// ambient state as the call), so no pattern below requires the `(`.
const FORBIDDEN: readonly ForbiddenPattern[] = [
  {
    pattern: /\bMath\s*\.\s*random\b/,
    why: 'ambient randomness — inject a port that yields the value'
  },
  {
    pattern: /\b(?:Date|performance)\s*\.\s*now\b/,
    why: 'ambient time — inject the `Clock` port'
  },
  {
    pattern: /\bcrypto\s*\.\s*(randomUUID|getRandomValues)\b/,
    why: 'ambient randomness — inject a port that yields the value'
  },
  {
    pattern: /\bprocess\s*\.\s*env\b/,
    why: 'ambient configuration — pass it in as a value'
  },
  {
    pattern: /\bglobalThis\s*[.[]/,
    why: 'ambient state — the core takes its dependencies as arguments'
  },
  {
    // `Math["random"]` reaches the same ambient state while hiding the member
    // name from the patterns above — so computed access on an ambient global
    // is banned as a form: use dot access, which the detector can read.
    pattern: /\b(?:Math|Date|crypto|performance|process)\s*\[/,
    why: 'computed access on an ambient global — use dot access so this detector can see what you reach for'
  },
  {
    pattern: /\brequire\s*\(/,
    why: 'dynamic module loading — the core has static dependencies only'
  }
]

interface Impurity {
  readonly line: number
  readonly why: string
  readonly text: string
}

/**
 * Blank out comments, keeping line numbers intact — prose is allowed to *name*
 * `Date.now()` (this file's own documentation does), only code may not call it.
 *
 * Deliberately lexical: block comments, and lines that are entirely a comment.
 * A trailing `// …` after code is left scanned, so it can still raise a false
 * positive — reword the comment rather than loosening this.
 */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => (/^\s*(\/\/|\*)/.test(line) ? '' : line))
    .join('\n')
}

/** Scan one source text; returns every ambient-state reach it contains. */
function findImpurities(source: string): readonly Impurity[] {
  return withoutComments(source)
    .split('\n')
    .flatMap((text, index) =>
      FORBIDDEN.filter(({ pattern }) => pattern.test(text)).map(({ why }) => ({
        line: index + 1,
        why,
        text: text.trim()
      }))
    )
}

/** Module specifiers a source reaches for: static, dynamic, side-effect, re-export. */
function specifiersOf(source: string): readonly string[] {
  const code = withoutComments(source)
  return [
    ...code.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
    ...code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g),
    ...code.matchAll(/\bimport\s+['"]([^'"]+)['"]/g)
  ].map((m) => m[1] ?? '')
}

/**
 * The hexagon imports nothing but itself: every specifier in a core production
 * file must be relative. This is the non-enumerative closure of Biome's
 * `noRestrictedImports` list — an enumeration of `node:` modules ages with
 * every Node release (`node:sqlite`, `node:zlib`, … were never on it), and a
 * bare legacy name (`fs`) or a stray npm package is the same hole. One
 * documented seam: the port contracts in a `testing/` folder run on vitest.
 */
function foreignSpecifiersIn(source: string, path: string): readonly string[] {
  // The Windows CI leg hands us backslash paths — compare in posix.
  const posixPath = path.replaceAll('\\', '/')
  return specifiersOf(source).filter((spec) => {
    if (spec.startsWith('./') || spec.startsWith('../')) {
      return false
    }
    return !(spec === 'vitest' && posixPath.includes('/testing/'))
  })
}

/** Every non-spec `.ts` file under the core, recursively. */
function coreSources(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return coreSources(path)
    }
    if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      return [path]
    }
    return []
  })
}

const coreRoot = fileURLToPath(new URL('.', import.meta.url))

describe('the detector itself', () => {
  // A fitness function nobody ever saw fail is indistinguishable from one that
  // does nothing. These pin the regexes against synthetic sources.
  it.each([
    ['const n = Math.random()', 'randomness'],
    ['const t = Date.now()', 'time'],
    ['const t = performance.now()', 'time'],
    ['const id = crypto.randomUUID()', 'randomness'],
    ['const home = process.env.HOME', 'configuration'],
    ['globalThis.cache = {}', 'state'],
    ['const fs = require("node:fs")', 'module loading'],
    // Evasions of the dot-access patterns: computed access on an ambient
    // global, and grabbing the function without calling it.
    ['const n = Math["random"]()', 'computed access'],
    ["const id = crypto['randomUUID']()", 'computed access'],
    ['globalThis["cache"] = {}', 'state'],
    ['const now = Date.now', 'reference without a call'],
    ['const rand = Math.random', 'reference without a call']
  ])('flags %j', (source) => {
    expect(findImpurities(source)).toHaveLength(1)
  })

  it.each([
    'const biggest = Math.max(a, b)',
    'const floor = Math.floor(localMs / MS_PER_HOUR)',
    'interface Instant { readonly epochMs: number }',
    'export function hourOfDay(instant: Instant): number {'
  ])('leaves %j alone', (source) => {
    expect(findImpurities(source)).toEqual([])
  })

  it.each([
    '// a comment about Date.now() is prose, not a call',
    ' * documenting why Math.random() is banned',
    '/* Date.now() named in a block comment */'
  ])('ignores %j', (source) => {
    expect(findImpurities(source)).toEqual([])
  })

  it('keeps line numbers accurate across a multi-line comment', () => {
    const source = '/* a\n b\n c */\nconst n = Math.random()'
    expect(findImpurities(source)[0]?.line).toBe(4)
  })

  it('reports the line and the reason, so the failure is actionable', () => {
    const [found] = findImpurities('const a = 1\nconst b = Math.random()')
    expect(found?.line).toBe(2)
    expect(found?.why).toContain('inject a port')
  })
})

describe('the foreign-import detector itself', () => {
  const anyCorePath = 'packages/core/src/greet/domain/greeting.ts'

  it.each([
    [
      "import { gzipSync } from 'node:zlib'",
      'a node: builtin Biome does not enumerate'
    ],
    ['import { DatabaseSync } from "node:sqlite"', 'double quotes'],
    ["const z = await import('node:zlib')", 'a dynamic import'],
    ["import { readFileSync } from 'fs'", 'a bare legacy builtin'],
    ["import Big from 'big.js'", 'an npm package'],
    ["import 'reflect-metadata'", 'a side-effect import'],
    ["export { x } from 'node:util'", 'a re-export']
  ])('flags %j (%s)', (source) => {
    expect(foreignSpecifiersIn(source, anyCorePath)).toHaveLength(1)
  })

  it.each([
    "import { greet } from './greet.ts'",
    "export type { Result } from '../shared/result.ts'",
    "const lazy = await import('./heavy.ts')"
  ])('leaves %j alone', (source) => {
    expect(foreignSpecifiersIn(source, anyCorePath)).toEqual([])
  })

  it('allows vitest inside a testing/ folder only', () => {
    const source = "import { describe, expect, it } from 'vitest'"
    expect(
      foreignSpecifiersIn(
        source,
        'packages/core/src/greet/testing/port-contracts.ts'
      )
    ).toEqual([])
    expect(foreignSpecifiersIn(source, anyCorePath)).toEqual(['vitest'])
  })

  it('ignores a specifier that only appears in prose', () => {
    expect(
      foreignSpecifiersIn("// don't import from 'node:fs' here", anyCorePath)
    ).toEqual([])
  })

  it('recognises a testing/ folder under Windows separators too', () => {
    // The Windows CI leg walks real paths with backslashes; the seam must
    // not silently close there (its first run proved it did).
    expect(
      foreignSpecifiersIn(
        "import { describe, expect, it } from 'vitest'",
        'packages\\core\\src\\greet\\testing\\port-contracts.ts'
      )
    ).toEqual([])
  })
})

describe('the core stays free of ambient state', () => {
  const sources = coreSources(coreRoot)

  it('finds sources to scan (a silent empty scan proves nothing)', () => {
    expect(sources.length).toBeGreaterThan(0)
  })

  it.each(sources)('%s reaches for nothing ambient', (path) => {
    const impurities = findImpurities(readFileSync(path, 'utf8'))
    const report = impurities
      .map(({ line, why, text }) => `  line ${line}: ${text}\n    → ${why}`)
      .join('\n')
    expect(impurities, `\n${path}\n${report}`).toEqual([])
  })

  it.each(sources)('%s imports nothing but the core itself', (path) => {
    const foreign = foreignSpecifiersIn(readFileSync(path, 'utf8'), path)
    expect(
      foreign,
      `\n${path} imports foreign modules: ${foreign.join(', ')}.` +
        '\nThe hexagon has zero production dependencies — I/O and ambient' +
        '\nstate live in an adapter behind a port. (vitest is allowed in' +
        '\na testing/ folder only.)'
    ).toEqual([])
  })
})
