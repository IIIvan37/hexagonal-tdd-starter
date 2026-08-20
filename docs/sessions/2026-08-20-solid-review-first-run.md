# Session — 2026-08-20 — first `/solid-review` run

## Done

- Ran `/solid-review` for the first time on this template. Until now its only
  measured yield (20 raw / 6 confirmed) came from the field project; the number
  in its SKILL description was borrowed, not earned here.
- **18 raw findings, 12 refuted, 6 confirmed**, 0 false positives surviving.
  23 agents, ~7 min, 1.2 M subagent tokens. Per-principle yield (kept / raw):
  OCP 2/3, SRP 2/4, LSP 2/4, ISP 0/3, DIP 0/4.
- Wrote the work queue to
  [docs/reviews/2026-08-20-solid-review.md](../reviews/2026-08-20-solid-review.md)
  — six unticked rows, each with its evidence, its cost, and the corrections its
  skeptic made to it. `docs/reviews/` is now 2 of 3.
- Rolled the session window: `2026-08-20-depth-review-harvest.md` moved to
  `docs/sessions/archive/`.
- Spot-checked the headline claim of finding 5 by hand before shipping the
  queue: `grep -rn 'clockContract('` returns three call sites, one of which is a
  fixture *string literal* in `registry-discipline.spec.ts:120`. The guard's two
  required replays are already being met by one real adapter and one piece of
  test data.

## Not done / remaining

- **All six findings are open.** Nothing was fixed this step — the run produced a
  queue, not a repair. Closing order is written into the queue: 1 (the port
  grammar module) first, because 2 and 3 consume it, then 5, 4, 6.
- Findings 1–3 are one defect wearing three hats and should close as one change:
  the gate has no module for *reading* TypeScript. The interface-block state
  machine is written twice and its regex a third time (already drifted); the
  comment stripper is written three times, two of them byte-identical.
  `.jscpd.json:3` ignores `**/*.spec.ts`, so none of it is visible to the clone
  detector.
- The ISP and DIP lenses returned 0 of 7 and both failed the same way. No
  workflow edit was made this step — unlike the depth-review's first run, whose
  calibration shipped in the same commit. Deliberate: one run is one data point,
  and the fix (a precondition on both prompts) is worth writing after the queue
  is closed, not before.

## Decisions

- No ADR. This step recorded findings and changed no boundary, invariant or
  toolchain. Findings 1 and 4 will each likely need one when they close — the
  first because it settles where the gate's TypeScript grammar lives, the second
  because it changes what `greetingSinkContract` obliges an adapter to do.
- Kept the review's own corrections *inside* the queue rather than flattening
  them into the claims: twice a skeptic confirmed a finding while falsifying part
  of it (the optional-member ratchet does not escape; the phantom third contract
  caller is a fixture string), and once it ruled the proposed fix wrong
  (`sink-unavailable` must not be deleted — the narrow `try` around a port call
  is doctrine). A reader who takes the raw claim without the correction does the
  wrong work.

## Gate status

- typecheck: ✅
- tests (with coverage): ✅ 268 passed / 25 files, 100 % statements, branches,
  functions, lines
- mutation (Stryker, local, if core touched): **skipped** — the step touched no
  mutated package. The only change is markdown under `docs/`.
- biome / sheriff / knip / jscpd: ✅ all green (0 clones, all Sheriff projects
  validated, no dead code)
- module watch: `pnpm modules:hint` — no candidate; both nurseries are empty.

## State to resume from

- **Single next action**: close finding 1 of the SOLID queue — give the gate a
  module for the port grammar (`scripts/port-grammar.ts` or the wider
  `scripts/ts-source.ts` that findings 2 and 3 also need), pinned by a fitness
  function in `docs/`, and teach it the `export type X = { … }` form. ADR-0010
  requires the new scan to be diffed against each old one before the extraction
  counts as done. Not a doc-only change — it needs a branch and a PR.
- Gotchas / half-done edits:
  - No half-done edits. The tree is clean apart from this report and the queue,
    both committed directly to `main` under the doc-only exception (a standalone
    review not attached to a code PR).
  - Two skeptics mutated the working tree to prove their findings (a probe port
    appended to `greet/application/ports.ts`, a contract replay deleted from
    `system-clock.spec.ts`) and restored it afterwards. `git status` and a full
    `pnpm gate` both confirm the tree is intact — but if something looks off in
    those two files, that is where to look first.
  - ADR-0010's *extract the shape, not the predicates* limit applies directly to
    finding 1: the three `ports.ts` file selectors genuinely disagree and must
    stay at their call sites. Only the grammar moves.
