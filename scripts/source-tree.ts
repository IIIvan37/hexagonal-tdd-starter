// The SOURCE TREE, as one vocabulary: where the packages are, how to walk one,
// and how to spell a path the same way on every platform. Declaration only —
// no effect on import.
//
// Split out after finding 3 of docs/reviews/2026-08-20-depth-review.md. Nine
// gate detectors each carried a private recursive walker over `packages/*/src`,
// differing only in the filename predicate; `packageRoots()` was byte-identical
// in four, `normalized` in three. `.jscpd.json` ignores `**/*.spec.ts`, so the
// repo's threshold-0 clone doctrine was structurally blind to all of it.
//
// The cost that decided it is the downstream half of ADR-0009: a project
// scaffolded from this template that grows an `apps/` root beside `packages/`
// edits ONE function here instead of nine near-identical private ones, with no
// clone detector and no compiler to name the one it missed. A total under-scan
// is caught — every detector asserts a non-empty scan — a partial one is not.
//
// This module deliberately holds the SHAPE of the walk and not the PREDICATES:
// "what counts as a production source" still differs per detector (`.tsx` or
// not, `.d.ts` excluded or not), and unifying those would change what each
// detector sees. Predicates stay at their call sites, where they are read
// beside the rule they serve.
//
// It lives in scripts/ rather than packages/core/src/ on purpose: a file under
// the core would land in Stryker's mutate globs, the 100 % coverage thresholds,
// knip's view and Sheriff's tagging — production weight for gate machinery that
// is not production code. Here it is still scanned by jscpd (only `*.spec.ts`
// is ignored), so a tenth copy has to be argued for.

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** One spelling for a path, so a `/`-shaped test works on Windows too. */
export const normalized = (path: string): string => path.replaceAll('\\', '/')

/**
 * Every `packages/<name>/src` in the workspace — adapters included.
 *
 * THE place to teach the gate about a second source root (an `apps/` tree, a
 * `services/` tree). Before this module that lesson had to be repeated in four
 * files, and missing one silently narrowed the scan rather than breaking it.
 */
export function packageRoots(): readonly string[] {
  const packages = fileURLToPath(new URL('../packages', import.meta.url))
  return readdirSync(packages, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packages, entry.name, 'src'))
    .filter((src) => existsSync(src))
}

/**
 * Files under `dir`, recursively, kept by `keep(path, name)`.
 *
 * The two-argument predicate is the generalized shape: some detectors select on
 * the filename alone (`ports.ts`), others on the position in the tree
 * (a `testing/` segment). Build artefacts are never source, so `.stryker-tmp`
 * and `node_modules` are skipped here rather than at each call site.
 */
export function filesUnder(
  dir: string,
  keep: (path: string, name: string) => boolean
): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '.stryker-tmp' || entry.name === 'node_modules'
        ? []
        : filesUnder(path, keep)
    }
    return keep(path, entry.name) ? [path] : []
  })
}
