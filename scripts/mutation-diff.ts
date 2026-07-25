// Mutation testing SCOPED TO THE DIFF: mutate only the core modules the
// current branch touches, so the close-step stays minutes long as the core
// grows. The full run (all modules) remains CI's post-merge job — that run is
// authoritative; this one is the fast local feedback loop.
//
// Run: pnpm test:mutation:diff   (at each close-step, see /session-report)
//
// Scope mapping (a scope = a --mutate glob):
//   - a changed file under core/src/<feature>/ scopes its whole module —
//     test-only changes still re-validate the module they test;
//   - a changed nursery file (core/src/domain|application) scopes both
//     nursery folders (they form one flat module, see ADR-0006);
//   - shared/ scopes shared/ (mutants there are killed by any covering test,
//     wherever it lives — perTest coverage analysis finds them);
//   - index.ts and testing/ are never mutated (stryker.config.json);
//   - no core change at all → nothing to mutate, exit 0.

import { spawnSync } from 'node:child_process'

const CORE_PREFIX = 'packages/core/src/'
const NURSERY = ['domain', 'application']

function gitLines(args: readonly string[]): string[] {
  const result = spawnSync('git', [...args], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`)
  }
  return result.stdout.split('\n').filter((line) => line !== '')
}

function mergeBase(): string {
  for (const ref of ['origin/main', 'main']) {
    const result = spawnSync('git', ['merge-base', 'HEAD', ref], {
      encoding: 'utf8'
    })
    if (result.status === 0) return result.stdout.trim()
  }
  throw new Error('no merge base with origin/main nor main')
}

// Committed + staged + unstaged vs the merge base, plus untracked newcomers.
const changed = [
  ...gitLines(['diff', '--name-only', mergeBase()]),
  ...gitLines(['ls-files', '--others', '--exclude-standard'])
]

const scopes = new Set<string>()
for (const file of changed) {
  if (!file.startsWith(CORE_PREFIX) || !file.endsWith('.ts')) continue
  const segment = file.slice(CORE_PREFIX.length).split('/')[0] as string
  if (segment.endsWith('.ts')) continue // root files (index.ts, fitness specs)
  if (segment === 'testing') continue // fakes barrel — never mutated
  if (NURSERY.includes(segment)) {
    for (const nursery of NURSERY) scopes.add(nursery)
  } else {
    scopes.add(segment)
  }
}

if (scopes.size === 0) {
  console.log(
    'mutation:diff — no core source touched, nothing to mutate ' +
      '(the full CI post-merge run stays authoritative).'
  )
  process.exit(0)
}

const globs = [
  ...[...scopes].sort().map((scope) => `${CORE_PREFIX}${scope}/**/*.ts`),
  `!${CORE_PREFIX}**/*.spec.ts`,
  `!${CORE_PREFIX}**/testing/**`
]

console.log(`mutation:diff — scopes: ${[...scopes].sort().join(', ')}`)
// --force: the incremental cache goes stale on survived mutants (new tests do
// not re-challenge them); a scoped fresh run is both faster and truthful.
const run = spawnSync(
  'pnpm',
  ['exec', 'stryker', 'run', '--force', '--mutate', globs.join(',')],
  { stdio: 'inherit' }
)
process.exit(run.status ?? 1)
