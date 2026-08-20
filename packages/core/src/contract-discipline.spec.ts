import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  filesUnder,
  normalized,
  packageRoots
} from '../../../scripts/source-tree.ts'

/**
 * Design fitness function for PORT CONTRACTS AND THEIR FAKES (ADR-0002).
 * Distilled from a field project's SOLID review, where the LSP findings
 * shared one root: substitutability promised on paper but unproven in
 * execution.
 *
 * 1. **A contract runs ×2 or it is a comment.** Every `*Contract` suite
 *    exported from a `testing/` directory must be replayed by at least two
 *    spec files: the reference fake AND one real adapter. One call site
 *    means the proof exists but proves nothing — in the field project the
 *    replay against the real adapter was silently LOST in a refactor, and
 *    the port's obligations held only by a server's incidental behaviour.
 * 2. **Fakes converge on the reference.** A spec or test-kit file that
 *    co-declares the whole member set of a port owning a reference fake is
 *    a hand-rolled double, free to drift out of the real value domain. Use
 *    the reference from the testing subpath; the sorted allowlist names the
 *    deliberate exceptions (all-fail brokens exercising the error path).
 */

/** Ports whose reference fake every hand-rolled double must converge on.
 * Register a port here the day it gains a reference fake. Example (from the
 * field project): { port: 'ProjectStore',
 *   members: ['list:', 'load:', 'save:', 'delete:'],
 *   reference: 'core/src/project/testing/in-memory-project-store.ts',
 *   allowed: ['web/src/app/shell/test-kit.tsx'] } */
const PORT_FAKES: ReadonlyArray<{
  readonly port: string
  readonly members: readonly string[]
  readonly reference: string
  readonly allowed: readonly string[]
}> = []

/** This very file spells member sets in its config — never a double. */
const self = fileURLToPath(import.meta.url)

/** Exported `…Contract` suites declared under a testing/ directory. */
function contractExports(): ReadonlyArray<{
  readonly name: string
  readonly file: string
}> {
  return packageRoots()
    .flatMap((root) =>
      filesUnder(root, (_path, name) => /^[^.]+\.ts$/.test(name))
    )
    .filter((path) => normalized(path).includes('/testing/'))
    .flatMap((path) =>
      [
        ...readFileSync(path, 'utf8').matchAll(
          /export function (\w+Contract)\(/g
        )
      ].map((match) => ({ name: match[1] as string, file: path }))
    )
}

describe('contract discipline over every package', () => {
  const specs = packageRoots().flatMap((root) =>
    filesUnder(root, (_path, name) => /\.spec\.tsx?$/.test(name))
  )

  it('still finds contract suites to hold to account', (context) => {
    const exports = contractExports()
    if (exports.length === 0) {
      context.skip()
      return
    }
    expect(exports.length).toBeGreaterThan(0)
  })

  it.each(contractExports())(
    'replays $name against the reference fake AND a real adapter',
    ({ name }) => {
      const callers = specs.filter((path) =>
        readFileSync(path, 'utf8').includes(`${name}(`)
      )
      expect(
        callers.length,
        `\n${name} is replayed by ${callers.length} spec file(s):` +
          `\n${callers.map((c) => `  ${c}`).join('\n')}` +
          `\nADR-0002 promises the contract against EVERY implementation — the` +
          `\nreference fake and at least one real adapter (≥ 2 call sites).`
      ).toBeGreaterThanOrEqual(2)
    }
  )

  it('keeps every hand-rolled double of a registered port on the allowlist', () => {
    const kits = packageRoots().flatMap((root) =>
      filesUnder(root, (_path, name) => /\.spec\.tsx?$|test-kit/.test(name))
    )
    for (const { port, members, reference, allowed } of PORT_FAKES) {
      const offenders = kits.filter((path) => {
        const p = normalized(path)
        if (path === self || allowed.some((suffix) => p.endsWith(suffix))) {
          return false
        }
        const source = readFileSync(path, 'utf8')
        return members.every((member) => source.includes(member))
      })
      expect(
        offenders,
        `\nhand-rolled ${port} double(s) outside the allowlist:` +
          `\n${offenders.map((o) => `  ${o}`).join('\n')}` +
          `\nConverge on the reference fake (${reference}) or add the file to` +
          `\nthe sorted allowlist with the reason it must stay hand-rolled.`
      ).toEqual([])
    }
  })
})
