import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ARCH_BEGIN,
  ARCH_END,
  currentMermaid,
  docOf,
  mermaidOf
} from '../scripts/arch-map.ts'

/**
 * Fitness function for the architecture map (docs/ARCHITECTURE.md).
 *
 * The map is GENERATED from the same source Sheriff enforces the boundaries
 * with (`getProjectData`), so the diagram and the rules cannot disagree. What
 * this spec guards is the remaining gap: the COMMITTED map drifting from the
 * tree — a feature emerges (ADR-0006), the gate enumerates the frontier, and
 * the map must follow in the same commit. Regenerate with `pnpm arch:map`.
 *
 * Honesty note: the map shows the graph REACHABLE from the entry points —
 * exactly what Sheriff verifies. An empty nursery or a not-yet-wired file does
 * not appear, and that is a feature: the map draws the shipped architecture,
 * not the aspiration.
 */

const DOCS = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(DOCS, '..')

describe('the generator itself', () => {
  const file = (
    module: string,
    tags: readonly string[],
    imports: readonly string[] = []
  ) => ({
    module,
    moduleType: 'barrel-less' as const,
    tags: [...tags],
    imports: [...imports],
    unresolvedImports: [],
    projectName: 'default'
  })

  it('folds files into modules and keeps only cross-module edges', () => {
    const data = {
      'packages/cli/src/main.ts': file(
        'packages/cli/src',
        ['cli'],
        ['packages/cli/src/run.ts']
      ),
      'packages/cli/src/run.ts': file(
        'packages/cli/src',
        ['cli'],
        ['packages/core/src/index.ts']
      ),
      'packages/core/src/index.ts': file('packages/core/src', ['core:api'])
    }
    const mermaid = mermaidOf([data])
    expect(mermaid).toContain('packages_cli_src --> packages_core_src')
    // main.ts -> run.ts is inside one module: no self-edge.
    expect(mermaid).not.toContain('packages_cli_src --> packages_cli_src')
  })

  it('bridges Windows separators (repo lesson, learned twice)', () => {
    const posix = {
      'packages/cli/src/run.ts': file(
        'packages/cli/src',
        ['cli'],
        ['packages/core/src/index.ts']
      ),
      'packages/core/src/index.ts': file('packages/core/src', ['core:api'])
    }
    const windows = {
      'packages\\cli\\src\\run.ts': file(
        'packages\\cli\\src',
        ['cli'],
        ['packages\\core\\src\\index.ts']
      ),
      'packages\\core\\src\\index.ts': file('packages\\core\\src', ['core:api'])
    }
    expect(mermaidOf([windows])).toBe(mermaidOf([posix]))
  })

  it('groups the modules of a feature in a labeled subgraph', () => {
    const data = {
      'packages/core/src/greet/domain/greeting.ts': file(
        'packages/core/src/greet/domain',
        ['feature:greet', 'layer:domain']
      )
    }
    const mermaid = mermaidOf([data])
    expect(mermaid).toContain('subgraph feature_greet["feature: greet"]')
    expect(mermaid).toContain('packages_core_src_greet_domain["greet/domain"]')
  })

  it('labels a package-root module by its tags (the api barrel)', () => {
    const data = {
      'packages/core/src/index.ts': file('packages/core/src', ['core:api'])
    }
    expect(mermaidOf([data])).toContain('packages_core_src["core:api"]')
  })

  it('is deterministic regardless of input order', () => {
    const a = file('packages/cli/src', ['cli'], ['packages/core/src/index.ts'])
    const b = file('packages/core/src', ['core:api'])
    const oneWay = {
      'packages/cli/src/run.ts': a,
      'packages/core/src/index.ts': b
    }
    const otherWay = {
      'packages/core/src/index.ts': b,
      'packages/cli/src/run.ts': a
    }
    expect(mermaidOf([otherWay])).toBe(mermaidOf([oneWay]))
  })

  it('merges several entry-point graphs into one map', () => {
    const production = {
      'packages/cli/src/run.ts': file(
        'packages/cli/src',
        ['cli'],
        ['packages/core/src/index.ts']
      ),
      'packages/core/src/index.ts': file('packages/core/src', ['core:api'])
    }
    const testing = {
      'packages/core/src/testing/index.ts': file('packages/core/src/testing', [
        'core:testing'
      ])
    }
    const mermaid = mermaidOf([production, testing])
    expect(mermaid).toContain('packages_cli_src')
    expect(mermaid).toContain('packages_core_src_testing')
  })
})

describe('the committed map tells the truth', () => {
  it('docs/ARCHITECTURE.md matches a fresh generation', () => {
    const committed = readFileSync(
      resolve(DOCS, 'ARCHITECTURE.md'),
      'utf8'
    ).replaceAll('\r\n', '\n')
    expect(
      committed.indexOf(ARCH_BEGIN),
      'ARCHITECTURE.md lost its generation markers'
    ).toBeGreaterThan(-1)
    expect(
      committed.indexOf(ARCH_END),
      'ARCHITECTURE.md lost its generation markers'
    ).toBeGreaterThan(committed.indexOf(ARCH_BEGIN))

    // The WHOLE document, not just the fenced block: the file says "do not
    // edit by hand", so the prose is generated output too and a hand-edit to
    // it is drift the gate should see. Composing the generator's own two
    // exported steps means this asserts the path `pnpm arch:map` actually
    // takes, instead of a copy of it kept in sync by hand.
    expect(
      committed,
      '\ndocs/ARCHITECTURE.md drifted from the tree (a module emerged or moved,' +
        '\nor the file was edited by hand).' +
        '\nRegenerate it: pnpm arch:map — the map must ship in the same commit' +
        '\nas the change that reshaped the graph.'
    ).toBe(docOf(currentMermaid(ROOT)))
  })
})
