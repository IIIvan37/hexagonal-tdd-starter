# Session — 2026-08-20 — depth-review first run and recalibration

## Done

- **Ran `/depth-review` for real, for the first time** — over `packages/core`,
  19 agents, ~10 min, 893 k subagent tokens. **Yield: 14 raw findings, 9
  refuted, 5 confirmed, 0 false positives surviving.** Recorded in the
  workflow's own `whenToUse`, the way `/solid-review` already carries its
  (20 raw, 14 refuted, 6 confirmed).
- **The result has a shape**: every survivor lives in the *gate machinery* or
  the build scripts — none in the hexagon, none in `greet/`, no port. Four of
  the five share one defect: a piece of knowledge (*what an adapter is*, *which
  files are skeleton*, *how you acquire the graph*, *what the source tree is*)
  that has no module and is re-derived at every site, in files `.jscpd.json`
  is configured not to scan.
  - `packages/core/src/fake-fidelity.spec.ts:234` (medium) — the ADR-0008 guard
    counts adapters by the `implements` keyword, so a const-typed or factory
    adapter leaves it asleep and the gate green. ADR-0008's own motivating
    evidence is `load: vi.fn(async () => {})` — the style its detector cannot
    see.
  - `scripts/eject-example.ts:49` (medium) — the skeleton/example taxonomy is
    declared twice (first-line markers + the `STUBS` map) and only one
    direction is checked. Has already drifted three times, once caught by a
    human review rather than a check.
  - `packages/core/src/contract-discipline.spec.ts:38` (low) — the source-tree
    walker re-derived in 8 detectors, `packageRoots()` byte-identical in 4.
  - `scripts/arch-map.ts:137` (low) — hides the fold, leaks how to acquire its
    input, so `docs/architecture.spec.ts` restates the protocol verbatim.
  - `packages/core/src/shared/result.ts:25` (low) — `isOk`/`isErr` have no
    consumer outside their own spec, and survive `eject:example` into every
    scaffolded project.
- **Fixed three defects in the workflow, found by running it.** This is the
  half of the step that was not planned:
  - `reportPrompt` accepted `refuted` but interpolated only `refuted.length`,
    while the prompt asked for a "Not retained" section. The report said so
    itself — *"I cannot itemise them without inventing them"*. The verdicts are
    now passed in as JSON, and the instruction says to write it in full.
  - Both workflows read `args?.context`, but the skill launch instruction the
    runtime generates renders `args` as a **bare string** — so this run
    reviewed with no caller history at all and the explorers fell back to
    reading `STATUS.md` themselves. `depth-review` and `solid-review` now
    accept either shape.
  - **Cross-lens corroboration measured as an anti-signal.** All 4 corroborated
    findings were refuted; all 5 survivors came from a single lens. Twice, two
    lenses agreeing meant they shared one misreading. The verifier is now told
    to treat corroboration as suspicion, and the writer no longer ranks by it
    or prints it.
- **Tightened the `leak` lens** — 5 raw, 0 kept, four killed by the same
  sentence: the transcription is a trade-off an ADR already decided (0002, 0004,
  0008). It now has a precondition: name the decision your claim contradicts, or
  drop the claim.
- **The review's output now lands in the repo**, not in a chat transcript: the
  write-up is [docs/reviews/2026-08-20-depth-review.md](../reviews/2026-08-20-depth-review.md),
  a work queue whose five findings carry a status box, plus the nine refuted
  claims with the ground each fell on. `docs/reviews/` is bounded at 3 by
  `docs/docs.spec.ts` — the rolling-window check is now a helper shared with
  `docs/sessions/` rather than a second copy, which is the same defect finding 3
  of this review reports. `depth-review.js` and CLAUDE.md both name the
  destination, so the next run does not have to be told.
  (A rendered copy was also published as an Artifact — a share surface, not the
  deliverable.)

## Not done / remaining

- **None of the five findings is fixed.** This step measured and recalibrated;
  the repairs are the next steps. The two harvest candidates
  (fake-fidelity recognizer, eject taxonomy check) are queued as step 9.
- The recalibrated workflow has **not been re-run** — the new lens preconditions
  and the corroboration wording are reasoned again, not measured. Second run
  measures them.
- The three local findings (walker duplication, `arch-map`, `result.ts`) are
  recorded but unscheduled; the walker one is a decision to record plus a
  narrowed jscpd ignore, not a repair.

## Decisions

- The depth review's own defects are fixed in place rather than written up — a
  workflow that cannot name what it rejected is a bug in the asset, not a
  boundary change. No ADR.
- `/solid-review` got the same one-line `args` fix as `/depth-review`: identical
  defect, same asset family, and leaving it would mean the next `/solid-review`
  also runs blind.
- The open question *"what does `/depth-review` actually yield?"* is resolved
  and deleted from STATUS. Its replacement is the question the run raised:
  whether the gate's own machinery is held to the doctrine it enforces on the
  hexagon, or whether the exemption gets written down.
- **Milestone reordered**: fixing the fake-fidelity recognizer is now a
  *prerequisite* to the first real feature, because that feature is precisely
  what is meant to wake the check — and today it would not.
- Module watch (ADR-0006): `pnpm modules:hint` finds no candidate; the nurseries
  are empty. Nothing to extract.

## Gate status

- typecheck: pass
- tests (with coverage): 245 passed / 23 files — statements 100 %, branches
  100 %, functions 100 %, lines 100 %
- mutation (Stryker, local): **not run — no core source touched.** This step
  changed two workflow scripts and two docs. The full run stays CI's post-merge
  job.
- biome / sheriff / knip / jscpd: pass — 0 clones. `docs/docs.spec.ts` 38 tests
  (+2, the reviews window). `docs/claude-assets.spec.ts` green on both edited
  workflows — and it earned its keep mid-step, catching an unescaped backtick
  that closed a template literal in `depth-review.js`.

## State to resume from

- **Single next action**: open the PR for this branch
  (`chore/depth-review-calibration`, 1 commit), then start step 9 — widen the
  fake-fidelity recognizer to count a port type in **any** implementation
  position (`implements X`, `: X =`, `): X`), widening `bodiesImplementing` and
  `ASYNC_METHOD` the same way, with one fixture per idiom in the existing
  `describe('the detectors themselves')` block.
- Gotchas / half-done edits:
  - Fixing only the counting side of the recognizer leaves the body side blind
    to an object-literal fake. Both halves, or the fix is cosmetic.
  - The eject-taxonomy spec belongs in `docs/`, not `scripts/` —
    `vitest.config.ts` includes only `packages/*/src/**` and `docs/**`, so a
    `scripts/eject-example.spec.ts` would silently never run. And it cannot be
    written yet: `eject-example.ts` performs its whole effect at module scope
    and exports nothing, so importing it to read `STUBS` runs the eject. Export
    the taxonomy first.
  - `docs/STATUS.md` is at 58 of its 60 non-blank lines. The next edit that adds
    a line has to remove one.
