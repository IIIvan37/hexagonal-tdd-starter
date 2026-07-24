# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: the architecture is now **visualized and drift-proof** —
  [ARCHITECTURE.md](ARCHITECTURE.md) is a module-level Mermaid map generated
  from Sheriff's own graph (`pnpm arch:map`); an emerged feature appears as a
  subgraph the moment it exists, the gate fails when the committed map drifts,
  and the eject regenerates it. Before that, the DX-review findings landed
  (strip-only enforced tree-wide via `erasableSyntaxOnly`, honest Node ≥ 25
  bootstrap, explicit audience, skills reconciled with the tree).
- **Core anatomy**: nurseries (`domain/`, `application/`, currently empty) →
  extracted feature modules (`greet/` is the worked example) + `shared/`
  kernel; public surface and purity fitness-checked.
- **Health**: 187 tests, 100 % coverage, 100 % mutation score; ejected
  skeleton replayed green (map included).

## Next action

Start the first real feature — the second adapter that proves port
substitutability.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1 | Hardening + emergent modules (ADR-0006) | ✅ merged |
| 2 | Detector hardening + doc truth (honest-review follow-up) | ✅ merged |
| 3 | Post-merge review fixes (eject red skeleton, doc drift) + ADR-0007 | ✅ PR #23 |
| 4 | DX findings (strip-only tree-wide, honest bootstrap, skills ↔ tree) | ✅ PR #24 |
| 5 | Architecture map (generated from Sheriff's graph, drift-checked) | ✅ delivered by the arch-map PR |
| 6 | _your first real feature_ — brings the second adapter that proves port substitutability | ⬜ |

## Open questions

- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Can STATUS staleness be fitness-checked?** Merge-invariant phrasing (the
  session-report skill demands it) removes the class that flips at merge —
  branch names, PR lifecycle — but a stale test count or phase still needs a
  reader to notice. No mechanical check yet.
