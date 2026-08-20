# Session — 2026-08-20 — the two harvest candidates, closed

## Done

- **Finding 1 — the fake-fidelity recognizer** (medium, the prerequisite to the
  first real feature). The ADR-0008 guard counted a production file as an
  adapter only when it matched `implements\s+[^{]*\bPort\b`, and read a fake
  body only from `class X … implements Port`, while `asyncPortsOf` in the same
  file was style-agnostic. The boundary moved to *what counts as an
  implementation of this port*:
  - `implementsPort()` reads the port in any implementation position —
    `implements X`, `const a: X =`, `): X`, `} satisfies X` — and
    `realAdapters` turns on it.
  - `bodiesImplementing` scans declaration blocks instead of class headers,
    looking for the port on the block's opening line and on its closing one,
    which is where `satisfies` lands. A declaration that ends before opening a
    brace is a value, not a block, so it no longer swallows the rest of the file.
  - `ASYNC_METHOD` learned the `load: async () =>` property form.
  - Seven fixtures cover the idioms one by one; an eighth runs the whole chain
    on `load: async () => {}` closed by `satisfies` — the exact shape ADR-0008's
    Context quotes, which its own detector could not see.
  - Probed the real tree: each async port still counts **one** adapter, so the
    guard stays dormant for the right reason rather than through blindness.
- **Finding 2 — the eject taxonomy, both directions** (medium). The
  prerequisite was a boundary, not a test: `eject-example.ts` performed its
  whole effect at module scope and exported nothing, so importing it to read
  `STUBS` ran the eject. `scripts/eject-taxonomy.ts` now holds the declaration
  and `eject-example.ts` the effect, as `arch-map.ts` already does.
  `docs/eject-taxonomy.spec.ts` asserts that every SKELETON ROLE file has a
  stub (the direction that was silent), that every stub still has its marker,
  that stubs name real files, and that the markers stay disjoint.
- **Both directions proven to fail before being trusted.** Injected drift twice:
  dropping a `STUBS` entry fires the previously-silent direction; pointing a
  stub at an unmarked file fires the other. A check that can only pass is not
  evidence.
- **The three exact-string edits stopped no-oping silently.** README's "Make it
  yours" tells the reader to rename packages *before* tearing out the example,
  after which `dropDependency(… '@app/core')` matches nothing, says nothing,
  and knip fails the ejected skeleton's gate with no clue why.
- **Ran `pnpm eject:example` for real, twice.** The first run caught a bug in
  this step's own work: the stubs do not carry the rewrite marker, so the new
  spec asserted on an empty set and the ejected skeleton came out **red** — the
  same class of bug `a523b40` fixed. The suite now skips when no DELETE-marked
  file remains, the way `fake-fidelity.spec.ts` skips a scan with no sources.
  Second run: eject clean with no warnings, ejected gate green (162 passed,
  7 skipped, 0 failed).

## Not done / remaining

- Findings 3, 4 and 5 of the review are still open, all low: the source-tree
  walker re-derived in 8 detectors, `arch-map.ts`'s leaked acquisition
  protocol, and `isOk`/`isErr`. Finding 3 is a decision plus a narrowed jscpd
  ignore, not a repair.
- **The eject machinery survives into every scaffolded project**, where it has
  nothing left to describe — the reason the new spec needs its skip. Whether
  the eject should remove itself (script, taxonomy, spec, and the
  `eject:example` entry) is a decision this step deliberately did not take;
  it is recorded as a follow-up in the review file.
- The recalibrated `/depth-review` still has not been re-run, so the new lens
  preconditions remain reasoned rather than measured.

## Decisions

- The eject taxonomy is split declaration-from-effect rather than tested
  through the filesystem. No ADR: this restores the separation `arch-map.ts`
  already had, it does not introduce a new one.
- The taxonomy spec is granted exactly one empty state, mechanically
  identified (no DELETE-marked file remains) rather than tolerated. Vacuous
  passes are what `fake-fidelity.spec.ts`'s docstring already forbids.
- `implementsPort` matches a port named in an implementation position anywhere
  in a file, which can over-count if a local annotation names a port. That
  direction fails **loud** — an early wake-up — where the old regex failed
  silent, and silence is the defect being repaired.
- Module watch (ADR-0006): `pnpm modules:hint` finds no candidate; the
  nurseries are empty.

## Gate status

- typecheck: pass
- tests (with coverage): 258 passed / 24 files (+13: 8 recognizer fixtures,
  5 taxonomy) — statements 100 %, branches 100 %, functions 100 %, lines 100 %
- mutation (Stryker, local): **not run — no core source touched.**
  `pnpm test:mutation:diff` says so itself and exits clean: both changes are
  spec files and build scripts, outside the mutated scope. The full run stays
  CI's post-merge job.
- biome / sheriff / knip / jscpd: pass — 0 clones.
- **Ejected skeleton replayed green**: 162 passed, 7 skipped, 0 failed.

## State to resume from

- **Single next action**: open the PR for this branch
  (`fix/fake-fidelity-recognizer`, 2 commits), then start step 10 — the first
  real feature as a hexagonal vertical slice (`/new-feature-hexa`). Its second
  adapter now actually wakes the fake-fidelity check whatever syntax it is
  written in, which is what step 9 existed to guarantee.
- Gotchas / half-done edits:
  - `docs/eject-taxonomy.spec.ts` skips wholesale in an ejected project. If you
    ever make the eject remove its own machinery, delete the skip with it —
    otherwise it becomes a check that can only skip.
  - The eject cannot be exercised by the gate (it mutates the tree). It was
    verified by running it and restoring with `git checkout -- . && git clean -fd`.
    Commit before doing that again.
  - `docs/STATUS.md` is at its bound. The next edit that adds a line must
    remove one.
