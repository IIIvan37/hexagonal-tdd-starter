# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: post-merge review fixes delivered by PR #23 — the ejected
  skeleton's gate is green again (the public-surface grammar accepts the
  empty-module marker `export {}`; the tdd-cycle skill no longer names the
  example's port path), Biome schema realigned to 2.5.5, and
  [ADR-0007](adr/0007-frontend-agnostic-starter.md) records that the starter
  stays frontend-agnostic (a UI is an adapter the consuming project owns).
- **Core anatomy**: nurseries (`domain/`, `application/`, currently empty) →
  extracted feature modules (`greet/` is the worked example) + `shared/`
  kernel; public surface and purity fitness-checked.
- **Health**: 179 tests, 100 % coverage, 100 % mutation score;
  the ejected skeleton's gate replayed green in an isolated worktree.

## Next action

Start step 4: the first real feature / loupe migration — the second adapter
that proves port substitutability.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1 | Hardening + emergent modules (ADR-0006) | ✅ merged |
| 2 | Detector hardening + doc truth (honest-review follow-up) | ✅ merged |
| 3 | Post-merge review fixes (eject red skeleton, doc drift) + ADR-0007 | ✅ PR #23 |
| 4 | _your first real feature_ / loupe migration — brings the second adapter that proves port substitutability | ⬜ |

## Open questions

- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Should the README state its audience?** The honest review says the
  template's real product is the agent-operated method; undecided whether the
  README should say so explicitly.
- **Can STATUS staleness be fitness-checked?** Merge-invariant phrasing (the
  session-report skill now demands it) removes the class that flips at merge —
  branch names, PR lifecycle — but a stale test count or phase still needs a
  reader to notice. No mechanical check yet.
