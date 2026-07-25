// Ejects the `greet` example slice, leaving a green, empty skeleton.
// Run: pnpm eject:example   (then: pnpm install && pnpm check:fix && pnpm gate)
//
// Driven by the first-line markers, so the deletion list cannot go stale:
//   - files marked  "EXAMPLE (greet slice) — DELETE"  are deleted;
//   - files marked  "EXAMPLE CONTENT, SKELETON ROLE"  are rewritten as minimal
//     stubs that keep the skeleton's guarantees alive (the three test
//     altitudes still run — the binary stub test keeps the strip-only
//     invariant locked even before your first feature);
//   - files marked  "KEEP" (shared/result.ts + spec) are untouched.
//
// It also drops the two dependencies knip would rightly flag as unused after
// the eject (`@app/core` in cli, `fast-check` at the root). Re-add them the
// moment your first feature needs them:
//   pnpm add -D fast-check && pnpm --filter <your-cli> add '@app/core@workspace:*'

import {
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'
import { writeArchitectureMap } from './arch-map.ts'

const DELETE_MARKER = 'EXAMPLE (greet slice) — DELETE'
const REWRITE_MARKER = 'EXAMPLE CONTENT, SKELETON ROLE'

/** Every .ts file under packages/, recursively. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      return sourceFiles(path)
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : []
  })
}

function firstLine(path: string): string {
  return readFileSync(path, 'utf8').split('\n', 1)[0] ?? ''
}

// ---------------------------------------------------------------------------
// Stubs for the SKELETON ROLE files: same file, same role, no example left.
// ---------------------------------------------------------------------------

const STUBS: Record<string, string> = {
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

const REGISTRY_STUB = `# Application registry (use-cases + ports)

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

// ---------------------------------------------------------------------------

function dropDependency(path: string, section: string, name: string): void {
  const pkg = JSON.parse(readFileSync(path, 'utf8'))
  if (pkg[section]?.[name] !== undefined) {
    delete pkg[section][name]
    writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
    console.log(`  - ${name} removed from ${path} (${section})`)
  }
}

console.log('Ejecting the greet example slice…\n')

console.log('DELETE-marked files:')
for (const file of sourceFiles('packages')) {
  if (firstLine(file).includes(DELETE_MARKER)) {
    rmSync(file)
    console.log(`  ✗ ${file}`)
  }
}

// The deletions empty the feature's folders (greet/domain, …): remove every
// now-empty directory, deepest first, so no hollow module shells remain —
// the nurseries keep their README and survive.
function pruneEmptyDirs(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      pruneEmptyDirs(join(dir, entry.name))
    }
  }
  if (readdirSync(dir).length === 0) {
    rmdirSync(dir)
    console.log(`  ✗ ${dir}/ (emptied)`)
  }
}
pruneEmptyDirs('packages')

console.log('\nSKELETON ROLE files, stubbed:')
for (const [file, stub] of Object.entries(STUBS)) {
  if (!firstLine(file).includes(REWRITE_MARKER)) {
    console.warn(`  ! ${file} has no rewrite marker — overwriting anyway`)
  }
  writeFileSync(file, stub)
  console.log(`  ↺ ${file}`)
}
writeFileSync('packages/core/src/application/README.md', REGISTRY_STUB)
console.log('  ↺ packages/core/src/application/README.md (registry emptied)')

// The map is generated from the tree, so the eject reshapes it: regenerate in
// the same operation, or docs/architecture.spec.ts fails the very next gate.
writeArchitectureMap(process.cwd())
console.log('  ↺ docs/ARCHITECTURE.md (regenerated from the ejected tree)')

console.log(
  '\nDependencies knip would flag (re-add when your feature needs them):'
)
dropDependency('packages/cli/package.json', 'dependencies', '@app/core')
dropDependency('package.json', 'devDependencies', 'fast-check')

console.log(`
Done. Finish with:

  pnpm install && pnpm check:fix && pnpm gate

Then build your first slice outside-in: /new-feature-hexa.`)
