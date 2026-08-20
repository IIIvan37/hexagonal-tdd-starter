# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: the method is **mechanically checked, replayable, and measured**,
  and both of its structural reviews have now run here and earned their own
  numbers. `/depth-review` (are the boundaries in the right places) scored 14
  raw / 5 confirmed; `/solid-review` (does the code respect known principles)
  scored 18 raw / 6 confirmed. Both fan out, then adversarially verify every
  finding before reporting it. **A review's output is a repo file**, not a chat
  message: [reviews/](reviews/) holds a tickable work queue, bounded at 3.
  The depth queue closed 5 of 5; **the SOLID queue is open, 0 of 6**.
- **What the two runs agree on**: eleven survivors between them, ten in the gate
  machinery and the build scripts, none in `greet/domain` or `greet/application`
  — [ADR-0010](adr/0010-the-gate-layer-is-held-to-the-doctrine.md)'s premise
  confirmed by measurement rather than by argument.
- **The open queue's centre of gravity**: the gate has no module for *reading*
  TypeScript — three findings are one defect, in files `.jscpd.json` is
  configured not to scan. Three more are guards proved not to guard, one of them
  already defeated in the tree today.
- **Core anatomy**: nurseries (`domain/`, `application/`, currently empty) →
  extracted feature modules (`greet/` is the worked example) + `shared/` kernel;
  public surface, purity, port shape, contracts, variants and the registry all
  fitness-checked. The assets that ARE the method are themselves gated
  (`docs/claude-assets.spec.ts`), because they travel by copy
  ([ADR-0009](adr/0009-method-travels-by-copy-and-harvest.md)).
- **Gate anatomy**: knowledge the gate needs has a module instead of a copy at
  every site — `scripts/source-tree.ts` (where the sources are, how to walk one)
  and `scripts/eject-taxonomy.ts` (which files are skeleton), each declared in
  `scripts/` and pinned by a fitness function in `docs/`. The grammar one layer
  up is the gap the SOLID queue names.
- **Health**: 268 tests, 100 % coverage, 100 % mutation score; ejected skeleton
  replayed green (map included).

## Next action

Close **finding 1 of the SOLID queue** — give the gate a module for the port
grammar (the queue names the candidate file, wide enough for findings 2 and 3),
declared under `scripts/` and pinned by a fitness function in `docs/`, taught the
`export type X = { … }` form. ADR-0010 requires diffing the new scan against each
old one, and keeps the three file selectors at their call sites.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1–9 | Hardening, emergent modules, doc truth, architecture map, both reviews as workflows, the gate over `.claude/`, first `/depth-review` run and its harvest | ✅ merged |
| 10 | The depth-review queue closed, 5 of 5 — the gate layer held to the doctrine ([ADR-0010](adr/0010-the-gate-layer-is-held-to-the-doctrine.md)) | ✅ delivered by PR #46 |
| 11 | First `/solid-review` run — 18 raw, 12 refuted, 6 confirmed; the queue is the deliverable | ✅ landed on `main` (doc-only) |
| 12 | Close the SOLID queue, 6 findings — the gate's TypeScript grammar gets a module, three defeated guards start guarding | ⬜ |
| 13 | _your first real feature_ — brings the second adapter that proves port substitutability | ⬜ |

## Open questions

- **Should the ISP and DIP lenses be recalibrated?** They returned 0 of 7: ISP
  reads a module's named exports as an interface consumers are forced through
  (false in ESM), DIP reads a documented decision as an undeclared dependency.
  One run is one data point — decide after the queue closes.
- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Should the eject remove itself?** The eject machinery survives into every
  scaffolded project, where it has nothing left to describe. Still undecided.
