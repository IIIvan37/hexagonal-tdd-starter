import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { filesUnder, normalized, packageRoots } from '../scripts/source-tree.ts'

/**
 * Fitness function for the gate's own source-tree vocabulary
 * (scripts/source-tree.ts).
 *
 * Finding 3 of docs/reviews/2026-08-20-depth-review.md folded nine private
 * walkers into one module. That concentrates a risk the clones diffused: every
 * detector in the gate now scans whatever THIS says the tree is, so a silent
 * narrowing here silently weakens all of them at once. The detectors each
 * assert a non-empty scan, which catches a total failure; what they cannot see
 * is a PARTIAL one — a root dropped, a directory wrongly skipped. That is what
 * the cases below pin.
 *
 * It lives in docs/ beside eject-taxonomy.spec.ts because vitest's `include`
 * covers `packages/*​/src/**` and `docs/**` only: a scripts/*.spec.ts would
 * never run.
 */

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const isTs = (_path: string, name: string): boolean => name.endsWith('.ts')

describe('normalized', () => {
  it('spells a Windows path the way the detectors match on', () => {
    expect(normalized('packages\\core\\src\\greet')).toBe(
      'packages/core/src/greet'
    )
  })

  it('leaves a posix path alone', () => {
    expect(normalized('packages/core/src/greet')).toBe(
      'packages/core/src/greet'
    )
  })
})

describe('packageRoots', () => {
  const roots = packageRoots()

  it('finds every package in the workspace (an empty scan proves nothing)', () => {
    expect(roots.length).toBeGreaterThanOrEqual(2)
  })

  it('names real directories, each a src/ of its package', () => {
    for (const root of roots) {
      expect(existsSync(root), `${root} does not exist`).toBe(true)
      expect(normalized(root).endsWith('/src')).toBe(true)
    }
  })

  it('includes the core and the adapters alike', () => {
    const named = roots.map((root) => normalized(root))
    expect(named.some((r) => r.endsWith('packages/core/src'))).toBe(true)
    expect(named.some((r) => r.endsWith('packages/cli/src'))).toBe(true)
  })
})

describe('filesUnder', () => {
  it('recurses, and keeps only what the predicate keeps', () => {
    const root = resolve(ROOT, 'packages/core/src')
    const found = filesUnder(root, isTs)
    expect(found.length).toBeGreaterThan(0)
    expect(found.every((path) => path.endsWith('.ts'))).toBe(true)
    // Proof of the recursion, stated STRUCTURALLY: at least one hit sits in a
    // subdirectory rather than at the root. Naming an example file here
    // (`greet/domain/greeting.ts`) turned the ejected skeleton red — caught by
    // replaying `pnpm eject:example`, and the same trap finding 2 of this
    // review describes. Nothing below is example knowledge.
    const depths = found.map(
      (path) =>
        normalized(path)
          .slice(normalized(root).length + 1)
          .split('/').length
    )
    expect(Math.max(...depths)).toBeGreaterThanOrEqual(2)
  })

  it('selects on the position in the tree, not the filename alone', () => {
    const kits = filesUnder(
      resolve(ROOT, 'packages/core/src'),
      (path, name) => normalized(path).includes('/testing/') && isTs(path, name)
    )
    expect(kits.length).toBeGreaterThan(0)
    expect(kits.map(normalized).every((p) => p.includes('/testing/'))).toBe(
      true
    )
  })

  // Both skips are checked against a SYNTHETIC tree, not the real one. Against
  // the repo they passed vacuously: packages/cli/node_modules holds only a
  // symlinked @app/core (readdir reports a symlink, not a directory, so the
  // walk stops there anyway) and .stryker-tmp does not exist between mutation
  // runs. Removing the skip left both green — proven by injection, which is
  // why they are written this way.
  describe('the build artefacts it must not descend into', () => {
    let sandbox: string

    beforeEach(() => {
      sandbox = mkdtempSync(join(tmpdir(), 'source-tree-'))
      mkdirSync(join(sandbox, 'src', 'deep'), { recursive: true })
      writeFileSync(join(sandbox, 'src', 'deep', 'real.ts'), '')
      for (const artefact of ['node_modules', '.stryker-tmp']) {
        mkdirSync(join(sandbox, artefact, 'nested'), { recursive: true })
        writeFileSync(join(sandbox, artefact, 'nested', 'copy.ts'), '')
      }
    })

    afterEach(() => {
      rmSync(sandbox, { recursive: true, force: true })
    })

    it('finds the real source and nothing else', () => {
      expect(filesUnder(sandbox, isTs).map(normalized)).toEqual([
        normalized(join(sandbox, 'src', 'deep', 'real.ts'))
      ])
    })

    it('skips node_modules', () => {
      // A dependency tree is not source: without this the gate would scan
      // every installed package and time out long before it reported anything.
      expect(
        filesUnder(sandbox, isTs).map(normalized).join('\n')
      ).not.toContain('/node_modules/')
    })

    it('skips the mutation sandbox', () => {
      // .stryker-tmp holds a COPY of the tree. A detector that walked into it
      // would report every finding twice and, mid-run, judge the mutants.
      expect(
        filesUnder(sandbox, isTs).map(normalized).join('\n')
      ).not.toContain('/.stryker-tmp/')
    })
  })
})
