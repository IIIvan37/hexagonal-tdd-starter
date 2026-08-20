# Session — 2026-08-20 — the depth-review queue closes, 5 of 5

## Done

- **Finding 5 — `isOk`/`isErr` deleted.** Both guards only renamed the
  discriminant, and a repo-wide grep found them nowhere but their own definition
  and spec. `ok`, `err` and the `Result` type are the kernel's whole surface now.
  The two spec cases were **rewritten rather than removed**, narrowing on
  `result.ok` directly, so the file demonstrates why there is no guard instead of
  leaving a silence a contributor would fill. `result.ts`: 10 mutants → 6, all
  killed.
- **Finding 4 — the arch-map generator's leaked protocol.** `arch-map.ts` exports
  `currentMermaid(root)` and `docOf(mermaid)`; `writeArchitectureMap` composes
  them in one line. `docs/architecture.spec.ts` no longer imports `config` or
  `getProjectData` to reconstruct the fold — it asserts the path `pnpm arch:map`
  actually runs. Made **stronger than the finding asked**: the spec compares the
  whole generated document, not just the fenced block, because the prose is
  generated output labelled "do not edit by hand" and a hand-edit to it was green
  before. Proven red by injection.
- **Finding 3 — the source tree, re-derived nine times.** `scripts/source-tree.ts`
  now holds `normalized`, `packageRoots()` and `filesUnder(dir, keep)`, imported
  by nine detectors — the eight the review named, plus `scripts/eject-taxonomy.ts`,
  which was born with a ninth copy one commit *after* the review predicted it.
  New fitness function `docs/source-tree.spec.ts` (10 cases).
- **Scan equivalence proven, not assumed.** A throwaway probe reimplemented each
  old private walker and diffed its output against the new one: all nine scans
  identical, file for file. This mattered because folding nine walkers into one
  concentrates a risk the clones diffused — each detector only asserts a
  *non-empty* scan, which catches a total failure and not a partial one.
- **Eject replayed end to end** in a throwaway clone: skeleton green, 172 passed,
  100 % coverage, every check clean.
- `docs/docs.spec.ts`'s docstring cited finding 3 as its motivation; updated to
  point at the closed state.

## Not done / remaining

- Nothing from this queue. All 5 rows of
  [reviews/2026-08-20-depth-review.md](../reviews/2026-08-20-depth-review.md) are
  ticked. It stays in the working set for now (window is 3, it is the only one);
  archive it when the next review lands.
- **Carried over, untouched** — the follow-up finding 2 raised: the eject
  machinery survives into every scaffolded project, where it has nothing left to
  describe. Whether the eject should remove itself is still undecided.
- **Deferred, recorded in the ADR**: moving the eight repo-wide detectors out of
  `packages/core/src/` to sit with the other gate specs in `docs/`. Arguably
  where they belong, larger than this finding called for.

## Decisions

- The gate's own code is held to the doctrine it enforces; gate modules live as
  declaration in `scripts/` + fitness function in `docs/` —
  [ADR-0010](../adr/0010-the-gate-layer-is-held-to-the-doctrine.md). This
  **retires the open question** STATUS carried about the gate layer's boundaries,
  answered in the extraction direction (the user's call — the exemption was the
  live alternative and is recorded there with its case).
- Extract the *shape* of the walk, not the predicates: the detectors disagree on
  "what counts as a production source" on purpose. Recorded in the ADR.

## Gate status

- typecheck: ✅
- tests (with coverage): ✅ 268 passed, 100 % statements / branches / functions /
  lines
- mutation (Stryker, local, diff-scoped): ✅ 100 % — 56 killed, 3 timeout, 0
  survived. `pnpm test:mutation` post-merge stays authoritative.
- biome / sheriff / knip / jscpd: ✅ all clean, 0 clones
- ejected skeleton: ✅ replayed, 172 passed, 100 % coverage
- `pnpm modules:hint`: no candidate (nurseries empty)

## State to resume from

- **Single next action**: build **your first real feature** as a hexagonal
  vertical slice (`/new-feature-hexa`) — step 10, the second adapter that proves
  port substitutability. Nothing blocks it.
- Gotchas / half-done edits: none — working tree clean, branch
  `chore/close-depth-review-queue`, PR #46 opened.
- **Two traps this step exposed, worth remembering when writing any fitness
  function over build artefacts:**
  1. Two assertions in the new spec passed **vacuously** against the real repo —
     `packages/cli/node_modules` holds only a symlinked workspace package (a walk
     stops at a symlink regardless of any skip) and `.stryker-tmp` does not exist
     between mutation runs. Deleting the skip they guarded left both green. They
     run against a **synthetic** tree now and were proven to fail on injected
     drift. The repo's own state is not a fixture.
  2. That spec's recursion case first asserted recursion by naming
     `greet/domain/greeting.ts` — which turned the **ejected** skeleton red, the
     same trap finding 2 licensed an empty state for. Caught only by replaying
     `pnpm eject:example`. Any new `docs/` spec must be checked against the
     ejected tree, not just this one.
