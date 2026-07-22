// A DISCOVERY HINT, never a verdict: scans the nursery (core/src/domain and
// core/src/application, flat files) for module candidates — the signals of
// ADR-0006. Naming a boundary is a domain act; this only points.
//
// Run: pnpm modules:hint   (typically at a close-step, see /session-report)
//
// Signals reported:
//   - prefix clusters: >= 3 files sharing a kebab-case prefix (in loupe, the
//     `chord-*` x5 cluster screamed for weeks before anyone looked);
//   - internal cohesion: how much the cluster imports itself vs the rest.

import { readdirSync, readFileSync } from 'node:fs'

const NURSERIES = ['packages/core/src/domain', 'packages/core/src/application']
const CLUSTER_MIN = 3

interface Candidate {
  readonly prefix: string
  readonly files: readonly string[]
  readonly internalImports: number
  readonly externalImports: number
}

function prodFilesOf(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() && e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts')
    )
    .map((e) => e.name.slice(0, -3))
}

function importsOf(dir: string, name: string): string[] {
  const source = readFileSync(`${dir}/${name}.ts`, 'utf8')
  return [...source.matchAll(/from '\.\/([a-z0-9-]+)\.ts'/g)]
    .map(([, sibling]) => sibling ?? '')
    .filter((sibling) => sibling !== '')
}

function candidatesIn(dir: string): Candidate[] {
  const files = prodFilesOf(dir)
  const byPrefix = new Map<string, string[]>()
  for (const file of files) {
    const prefix = file.split('-')[0] ?? file
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), file])
  }
  return [...byPrefix.entries()]
    .filter(([, members]) => members.length >= CLUSTER_MIN)
    .map(([prefix, members]) => {
      const cluster = new Set(members)
      let internal = 0
      let external = 0
      for (const member of members) {
        for (const dep of importsOf(dir, member)) {
          if (cluster.has(dep)) {
            internal += 1
          } else {
            external += 1
          }
        }
      }
      return {
        prefix,
        files: members,
        internalImports: internal,
        externalImports: external
      }
    })
}

let found = 0
for (const nursery of NURSERIES) {
  for (const candidate of candidatesIn(nursery)) {
    found += 1
    console.log(`\nmodule candidate in ${nursery}: "${candidate.prefix}"`)
    console.log(
      `  files (${candidate.files.length}): ${candidate.files.join(', ')}`
    )
    console.log(
      `  cohesion: ${candidate.internalImports} imports inside the cluster, ` +
        `${candidate.externalImports} outside`
    )
  }
}

if (found === 0) {
  console.log(
    'No module candidate in the nurseries (no prefix shared by ' +
      `${CLUSTER_MIN}+ files). Boundaries may still be apparent to you — this ` +
      'is a hint, not a verdict.'
  )
} else {
  console.log(
    '\nIf one of these IS a concept: name it, git mv the slice into ' +
      'core/src/<name>/{domain,application}, and let the gate enumerate the ' +
      'frontier (ADR-0006).'
  )
}
