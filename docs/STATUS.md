# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: the method is **mechanically checked, replayable, and measured** —
  and the machinery that does the checking is now held to the same rules as the
  code it checks ([ADR-0010](adr/0010-the-gate-layer-is-held-to-the-doctrine.md)).
  Its two structural reviews are workflows in `.claude/workflows/` —
  `/solid-review` (does the code respect known principles) and `/depth-review`
  (are the boundaries in the right places at all). Both fan out, then
  adversarially verify every finding before reporting it, and both carry a real
  yield rather than a reasoned one: depth-review's first run scored 14 raw, 9
  refuted, 5 confirmed, and was recalibrated on its own numbers — the `leak` lens
  gained a precondition, and cross-lens corroboration turned out to be an
  anti-signal. **A review's output is a repo file**, not a chat message:
  [reviews/](reviews/) holds a tickable work queue, bounded at 3 like
  [sessions/](sessions/). That queue is now **5 of 5 closed**.
  The assets that ARE the method are themselves gated
  (`docs/claude-assets.spec.ts`), because they travel by copy
  ([ADR-0009](adr/0009-method-travels-by-copy-and-harvest.md)) — a broken asset
  reaches a project whose author has no reason to doubt it.
- **Core anatomy**: nurseries (`domain/`, `application/`, currently empty) →
  extracted feature modules (`greet/` is the worked example) + `shared/`
  kernel; public surface, purity, port shape, contracts, variants and the
  registry all fitness-checked. The `Result` kernel is `ok`/`err`/`Result` and
  nothing else. The ADR-0008 fake-fidelity guard recognises an adapter by
  **shape**, not by the `implements` keyword; the eject taxonomy is checked in
  both directions.
- **Gate anatomy**: knowledge the gate needs has a module instead of a copy at
  every site — `scripts/source-tree.ts` (where the sources are, how to walk one)
  and `scripts/eject-taxonomy.ts` (which files are skeleton), each declared in
  `scripts/` and pinned by a fitness function in `docs/`.
- **Health**: 268 tests, 100 % coverage, 100 % mutation score; ejected skeleton
  replayed green (map included).

## Next action

Build **your first real feature** as a hexagonal vertical slice
(`/new-feature-hexa`) — the second adapter that proves port substitutability.
Nothing blocks it, and the review queue is empty.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1–7 | Hardening, emergent modules, doc truth, architecture map, depth-review harvest, both reviews as workflows + the gate over `.claude/` | ✅ merged |
| 8 | First real `/depth-review` run — 14 raw, 9 refuted, 5 confirmed; workflow recalibrated on its own yield | ✅ delivered by PR #43 |
| 9 | The two harvest candidates closed — adapter recognition by shape, eject taxonomy checked both ways | ✅ delivered by PR #44 |
| 10 | The review queue closed, 5 of 5 — the gate layer held to the doctrine ([ADR-0010](adr/0010-the-gate-layer-is-held-to-the-doctrine.md)) | ✅ |
| 11 | _your first real feature_ — brings the second adapter that proves port substitutability | ⬜ |

## Open questions

- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Can STATUS staleness be fitness-checked?** Merge-invariant phrasing (the
  session-report skill demands it) removes the class that flips at merge —
  branch names, PR lifecycle — but a stale test count or phase still needs a
  reader to notice. No mechanical check yet.
- **Should the eject remove itself?** The eject machinery (script, taxonomy,
  spec, the `eject:example` entry) survives into every scaffolded project, where
  it has nothing left to describe. Raised closing finding 2, still undecided.
