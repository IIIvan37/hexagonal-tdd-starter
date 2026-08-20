# Session — 2026-08-20 — depth-review harvest

## Done

- **Two ADRs consigned before the code they justify** —
  [ADR-0008](../adr/0008-port-contracts-model-the-hard-dimension.md) and
  [ADR-0009](../adr/0009-method-travels-by-copy-and-harvest.md), indexed.
- **Registry fitness function**
  (`packages/core/src/registry-discipline.spec.ts`) — the ports table must
  describe the tree in **both** directions. Proved red both ways against the
  real registry (ghost row, then unregistered port) before committing.
- **Port width ceiling** — fixed at 6 callable members, added to
  `packages/core/src/port-discipline.spec.ts` (same subject as the optional
  member pin). Proved red by inflating `Clock` to 7 members.
- **Dormant fake-fidelity detector** (`packages/core/src/fake-fidelity.spec.ts`)
  — fires only for an async port with ≥ 2 real adapters. Verified live by adding
  a temporary second `NameSource` adapter: it woke and named exactly
  `InMemoryNameSource.load()`. That run caught a real defect in the detector —
  it scanned the whole file instead of the class implementing the port, so it
  attributed `save()` to `NameSource`; fixed and re-verified.
- **`ADR 0008` pointer in the greet kit** — the example's fakes stay degenerate
  on purpose (one adapter per port); the comment says copy their shape, not
  their settlement.
- **`docs/agents/domain.md`** — where the vocabulary lives, and why there is no
  `CONTEXT.md`. Added to the living-docs list in `docs/docs.spec.ts`.
- **Harvest ritual named** — `Harvest` section in `CLAUDE.md` +
  `.claude/skills/template-harvest/SKILL.md`.
- **Doc-only exception narrowed to `*.md`** — found in flight: `^docs/` let a
  change to `docs/docs.spec.ts` skip the gate and bypass the branch rule. Fixed
  in the husky pre-commit, the PreToolUse guard and CLAUDE.md.

Source: a module-depth review run on the field project (8 candidates,
4 explorers, cross-corroborated). Findings 05/06/07 and its "noted, not
retained" section are what this step harvested.

## Not done / remaining

- **`depth-review` workflow** — `.claude/workflows/depth-review.js`, modelled on
  `solid-review.js` (parallel explorers, cross-corroboration as strength signal,
  adversarial verification), depth/seam lens translated into hexagonal terms,
  Artifact output. Its PR also carries the **shape test over `.claude/`**
  (skills *and* workflows: valid frontmatter, referenced commands present in
  `package.json`, referenced paths existing).
- Nothing half-edited; the tree is clean.

## Decisions

- A port contract must model the dimension its implementations differ on; the
  detector is dormant below two real adapters —
  [ADR-0008](../adr/0008-port-contracts-model-the-hard-dimension.md).
- The method travels by copy and harvest, not by plugin reference; the template
  declares no external plugin —
  [ADR-0009](../adr/0009-method-travels-by-copy-and-harvest.md).
- Port width capped at a **fixed** 6, not ratcheted to today's maximum: pinning
  at what `greet` needs would make every real project red on arrival, and the
  first reflex would be to raise the bound.
- No `CONTEXT.md`: the vocabulary lives in the domain types and the ADRs, and a
  third prose copy would drift from both with nothing able to catch it.
- Third-party skill plugins stay **user-scoped** — `enabledPlugins` has no
  version field, so the template will not promise behaviour it cannot pin.
- Module watch (ADR-0006): `pnpm modules:hint` finds no candidate; the nurseries
  are empty. Nothing to extract.

## Gate status

- typecheck: pass
- tests (with coverage): 234 passed / 22 files — statements 100 %, branches
  100 %, functions 100 %, lines 100 %
- mutation (Stryker, local, diff-scoped to `greet`): **100 %** — 59 killed,
  3 timeout, 0 survived, 0 no-cov. The full run stays CI's post-merge job.
- biome / sheriff / knip / jscpd: pass — Sheriff clean on `cli` and
  `core-testing`, 0 clones.

## State to resume from

- **Single next action**: open the PR for this branch
  (`feat/depth-review-harvest`, 7 commits), then start the `depth-review`
  workflow PR.
- Gotchas / half-done edits:
  - The fake-fidelity detector is **silent on this repo by design**. To see it
    work, add a second class implementing `NameSource` outside `testing/` and
    run its spec — then remove it. Do not "fix" its silence.
  - `grep` in an interactive shell here may be a `ugrep` shell function whose
    `-q -v` differs from GNU grep. The hooks run under non-interactive `sh` and
    resolve `/usr/bin/grep`, so verify hook predicates with `sh -c`, not from
    the interactive shell — a check run the wrong way reports a phantom hole.
