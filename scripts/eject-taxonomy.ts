// The eject TAXONOMY: which files are the example, which carry a skeleton role,
// and what replaces the second kind. Declaration only — no effect on import, so
// docs/eject-taxonomy.spec.ts can check the two representations against each
// other. Its neighbour scripts/eject-example.ts owns the effect.
//
// Split out after finding 2 of docs/reviews/2026-08-20-depth-review.md: the map
// below and the first-line markers each say "which files are skeleton", and
// only one direction was ever checked.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const DELETE_MARKER = 'EXAMPLE (greet slice) — DELETE'
export const REWRITE_MARKER = 'EXAMPLE CONTENT, SKELETON ROLE'

/** Every .ts file under packages/, recursively. */
export function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      return sourceFiles(path)
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : []
  })
}

export function firstLine(path: string): string {
  return readFileSync(path, 'utf8').split('\n', 1)[0] ?? ''
}

// ---------------------------------------------------------------------------
// Stubs for the SKELETON ROLE files: same file, same role, no example left.
// ---------------------------------------------------------------------------

export const STUBS: Record<string, string> = {
  'packages/core/src/index.ts': `// Public contract of the core (the only surface adapters consume).
// Empty until your first slice exports something — a consumer first (README).
export {}
`,

  'packages/core/src/testing/index.ts': `// Test-support surface of the core, consumed by adapters through \`@app/core/testing\`.
// Kept out of \`src/index.ts\` on purpose: production code must not be able to
// import a fake, and this module is the only place allowed to depend on vitest.
// Add your first port's contract + in-memory fake here (/new-feature-hexa).
export {}
`,

  'packages/cli/src/run.ts': `import { EXIT_MISUSE } from './report.ts'

/**
 * Composition root: parse argv, inject the real ports into the use-case, map the
 * Result to an exit code. No business logic here — wording and exit codes live
 * in \`report.ts\`. Return the exit code, never call \`process.exit\` from here.
 *
 * The example slice was ejected: build your first one (/new-feature-hexa).
 */
export async function run(_argv: readonly string[]): Promise<number> {
  console.error('no feature yet — write the first acceptance test (/new-feature-hexa)')
  return EXIT_MISUSE
}
`,

  'packages/cli/src/report.ts': `/** Exit codes, as a CLI convention — a presentation concern, not a domain one. */
export const EXIT_MISUSE = 2

// When your first use-case returns a tagged error union, map it here to a
// message + exit code, exhaustively (switch + \`exhausted(error: never)\` —
// see docs/adr/0004-errors-as-tagged-values.md for the pattern).
`,

  'packages/cli/src/run.spec.ts': `import { afterEach, describe, expect, it, vi } from 'vitest'
import { run } from './run.ts'

// Acceptance-test altitude (in process). Rewrite around your first slice.
afterEach(() => {
  vi.restoreAllMocks()
})

describe('run — ejected skeleton', () => {
  it('explains itself and exits with the misuse code', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(run([])).resolves.toBe(2)
    expect(err).toHaveBeenCalledOnce()
  })
})
`,

  'packages/cli/src/main.spec.ts': `import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const mainPath = fileURLToPath(new URL('./main.ts', import.meta.url))

// Binary-test altitude: the \`bin\` runs .ts sources under plain node (strip-only
// type stripping). This stub keeps that invariant locked between the eject and
// your first feature — see docs/adr/0001-strip-only-typescript-no-build-step.md.
describe('the CLI binary, run by plain node', () => {
  it('starts, refuses politely, and exits with the misuse code', async () => {
    try {
      await execFileAsync(process.execPath, [mainPath])
      expect.unreachable('the stub must exit non-zero')
    } catch (thrown) {
      const failure = thrown as { code?: number; stderr?: string }
      expect(failure.code).toBe(2)
      expect(failure.stderr).toContain('no feature yet')
    }
  })
})
`
}

export const REGISTRY_STUB = `# Application registry (use-cases + ports)

> The registry itself is SKELETON — keep this file, and keep it in sync.

The single place to look before adding a feature, so ports and use-cases get
**reused, not reinvented** (\`/new-feature-hexa\`).

## Use-cases

| Use-case | Signature | Notes |
|----------|-----------|-------|
| _(none yet)_ | | |

## Ports

| Port | Kind | Contract | Implemented by |
|------|------|----------|----------------|
| _(none yet)_ | | | |

Every port owns a **contract** (obligations written once, replayed against each
implementation) and an in-memory fake, both in \`../testing/\`. Add them in the
same step as the port.
`

/** Files whose first line carries `marker`, as repo-relative POSIX paths. */
export function markedFiles(marker: string, root = 'packages'): string[] {
  return sourceFiles(root)
    .filter((path) => firstLine(path).includes(marker))
    .map((path) => path.replaceAll('\\', '/'))
}
