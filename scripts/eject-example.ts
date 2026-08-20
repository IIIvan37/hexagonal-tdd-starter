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
import {
  DELETE_MARKER,
  firstLine,
  REGISTRY_STUB,
  REWRITE_MARKER,
  STUBS,
  sourceFiles
} from './eject-taxonomy.ts'

// ---------------------------------------------------------------------------

// An exact-string edit that matches nothing is the same class of failure as an
// unlisted skeleton file, one level down: silent. README's "Make it yours" tells
// the reader to rename packages BEFORE tearing out the example, after which
// `@app/core` no longer exists under that name — and knip then fails the
// ejected skeleton's gate with no clue why. So every edit below says when it
// found nothing to do.
function dropDependency(path: string, section: string, name: string): void {
  const pkg = JSON.parse(readFileSync(path, 'utf8'))
  if (pkg[section]?.[name] === undefined) {
    console.warn(
      `  ! ${name} not found in ${path} (${section}) — already gone, or renamed`
    )
    return
  }
  delete pkg[section][name]
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`  - ${name} removed from ${path} (${section})`)
}

/** Renames a root-level npm script, keeping its command. */
function renameScript(path: string, from: string, to: string): void {
  const pkg = JSON.parse(readFileSync(path, 'utf8'))
  if (pkg.scripts?.[from] === undefined) {
    console.warn(`  ! ${path} has no script "${from}" — nothing renamed`)
    return
  }
  pkg.scripts[to] = pkg.scripts[from]
  delete pkg.scripts[from]
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`  ↺ ${path} script "${from}" renamed to "${to}"`)
}

/** Replaces one example-referencing sentence in an otherwise-kept doc file. */
function rewriteMention(path: string, search: string, replace: string): void {
  const content = readFileSync(path, 'utf8')
  const rewritten = content.replace(search, replace)
  if (rewritten === content) {
    console.warn(`  ! ${path} no longer contains the sentence to rewrite`)
    return
  }
  writeFileSync(path, rewritten)
  console.log(`  ↺ ${path} (example mention removed)`)
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
rewriteMention(
  'packages/core/src/domain/README.md',
  'The `greet` feature next door is what an extracted module looks like.',
  'An extracted feature module will sit next door once one emerges.'
)

// The map is generated from the tree, so the eject reshapes it: regenerate in
// the same operation, or docs/architecture.spec.ts fails the very next gate.
writeArchitectureMap(process.cwd())
console.log('  ↺ docs/ARCHITECTURE.md (regenerated from the ejected tree)')

console.log(
  '\nDependencies knip would flag (re-add when your feature needs them):'
)
dropDependency('packages/cli/package.json', 'dependencies', '@app/core')
dropDependency('package.json', 'devDependencies', 'fast-check')

console.log('\nRoot script, renamed off the example name:')
renameScript('package.json', 'greet', 'start')

console.log(`
Done. Finish with:

  pnpm install && pnpm check:fix && pnpm gate

Then build your first slice outside-in: /new-feature-hexa.`)
