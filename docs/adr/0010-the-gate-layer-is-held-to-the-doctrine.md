# ADR 0010 — Hold the gate's own code to the doctrine it enforces

- **Status**: accepted
- **Date**: 2026-08-20

## Context

The first real `/depth-review` run (2026-08-20) confirmed five findings, and
**all five lived in the gate machinery or the build scripts** — none in the
hexagon, none in `greet/`, no port. Four shared one shape: a piece of knowledge
with no module, re-derived at every site, in files the tooling was configured
not to look at.

The sharpest instance: nine detectors each carried a private recursive walk over
`packages/*/src`, differing only in the filename predicate. `packageRoots()` was
byte-identical in four, `normalized` in three. `.jscpd.json` ignores
`**/*.spec.ts`, so the repo's own threshold-0 clone doctrine was **structurally
blind** to the largest clone in the tree. The exclusion had been configured; the
nine-way clone had never been decided. The review predicted the next change
would write a ninth copy — and it did, in `scripts/eject-taxonomy.ts`, one
commit later.

This left a question STATUS carried openly: *do the gate's own boundaries
deserve the same rules as the hexagon's?* Either that layer is held to the
doctrine, or the exemption is written down. Leaving it unanswered is what let
the clone reach nine.

The cost is not aesthetic. Under [ADR-0009](0009-method-travels-by-copy-and-harvest.md)
this template travels by copy. A consuming project that grows an `apps/` root
beside `packages/` must teach the gate where its sources are. With the knowledge
diffused it edits nine near-identical private functions with no clone detector
and no compiler to name the one it missed. Every detector asserts a non-empty
scan, so a **total** failure is caught — a **partial** one is not, and a
detector that silently scans less than it should still reports green.

## Decision

The gate's own code is held to the same rules as the hexagon: knowledge that is
re-derived gets a module.

Where such a module goes is settled too — **declaration in `scripts/`, fitness
function in `docs/`**, the address `scripts/eject-taxonomy.ts` +
`docs/eject-taxonomy.spec.ts` established and `scripts/source-tree.ts` +
`docs/source-tree.spec.ts` now follows. Two constraints force it:

- **Not `packages/core/src/`.** A file there lands in Stryker's mutate globs,
  the 100 % coverage thresholds, knip's view and Sheriff's tagging — production
  weight applied to machinery that is not production code, and a value export
  the public-surface rule would then have to reason about.
- **Not `scripts/*.spec.ts`.** `vitest.config.ts` includes only
  `packages/*/src/**` and `docs/**`, so a spec beside the script would never
  run — the failure mode is silence, not an error.

`scripts/` is still scanned by jscpd (only `*.spec.ts` is ignored), so the next
copy has to be argued for rather than appearing unnoticed.

Two limits on the rule, both learned in applying it:

- **Extract the shape, not the predicates.** `source-tree.ts` owns the walk;
  "what counts as a production source" stays at each call site, because the
  detectors genuinely disagree (`.tsx` or not, `.d.ts` excluded or not) and
  unifying them would change what each one sees.
- **Prove the scan is unchanged.** Folding N walkers into one concentrates a
  risk the clones diffused. An extraction here is not done until the new scan is
  diffed against each old one, file for file.

## Consequences

**What it buys.** One place to teach the gate about a new source root. The
largest clone in the tree is gone and the remaining ones are visible to jscpd. A
detector's scan is now testable on its own — `docs/source-tree.spec.ts` pins
recursion, the artefact skips and the package roots, which no private walker
ever had.

**What it costs — and this is the real price.** A detector is no longer
portable as a single file. ADR-0009 says the method travels by copy, and copying
`purity.spec.ts` into a field project now means copying `scripts/source-tree.ts`
with it. That tension is accepted rather than resolved: the alternative was nine
copies of a walk that the receiving project must edit correctly nine times, and
a partial miss there is silent. A dependency you can see beats a duplication you
cannot.

Two smaller costs. The concentration risk is real — a silent narrowing in
`source-tree.ts` now weakens every detector at once, which is why its spec
exists and why scan equivalence must be proven at each change. And a `scripts/`
module is outside the coverage and mutation thresholds, so its guarantees come
from its `docs/` fitness function alone; that spec has to be written as if
nothing else were watching.

**A trap this exposed, worth naming.** Two of that spec's assertions passed
**vacuously** against the real repo — `packages/cli/node_modules` holds only a
symlinked workspace package (readdir reports a symlink, not a directory, so a
walk stops there regardless) and `.stryker-tmp` does not exist between mutation
runs. Deleting the skip they were written to guard left both green. Fitness
functions over build artefacts must be written against a **synthetic** tree and
proven to fail on injected drift; the repo's own state is not a fixture.

## Alternatives considered

- **Write the exemption down instead** — an ADR saying gate detectors are
  deliberately self-contained, plus a narrowed jscpd ignore so a tenth copy has
  to be argued for. The honest case for it is ADR-0009: a self-contained
  detector is copy-portable, which is how the method actually travels. It lost
  on the downstream cost. The exemption keeps the copying cheap for whoever
  ships a detector and expensive for whoever must *maintain* nine of them, and
  the failure mode it preserves is a silent partial scan — the one thing a gate
  must never do quietly.

- **Put the module under `packages/core/src/`** — colocated with its eight
  consumers, and covered by the existing thresholds for free. Rejected: it
  applies mutation, coverage, knip and Sheriff obligations to gate machinery,
  and puts a non-domain value export inside the hexagon the public-surface rule
  guards.

- **Unify the predicates as well** — one `productionSources()` for every
  detector. Rejected: the detectors disagree on purpose, and folding them would
  silently change what three of them scan. That is the same silent-narrowing
  failure this ADR exists to prevent.

- **Move the detectors out of `packages/core/src/` entirely**, to sit beside the
  other gate specs in `docs/`. Arguably where they belong — they are repo-wide
  fitness functions that scan both packages from inside one of them. Deferred,
  not rejected: it is a larger move than the finding called for, and it trades
  against the colocation convention CLAUDE.md states for specs.
