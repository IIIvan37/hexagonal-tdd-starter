# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: emergent feature modules ([ADR-0006](adr/0006-emergent-feature-modules.md))
  merged to `main` (PR #20); Dependabot #8/#19 merged. Current step: detector
  hardening + doc truth on `chore/doc-truth-and-detector-hardening` — Sheriff
  now verifies the testing subtree (second entry point), purity and
  public-surface fitness functions reject their evasion forms, and living docs
  are fitness-checked for path existence (first run caught six broken refs).
  A second review folded in: `main.ts` sets `exitCode` (no mid-flush exit),
  the core may only import itself (non-enumerative `node:` closure), and
  adapter specs no longer count as public-surface consumers.
- **Branch**: `chore/doc-truth-and-detector-hardening`.
- **Core anatomy**: nurseries (`domain/`, `application/`, currently empty) →
  extracted feature modules (`greet/` is the worked example) + `shared/`
  kernel; public surface and purity fitness-checked.
- **Health**: 152 tests, 100 % coverage, 100 % mutation score.

## Next action

Open the PR for `chore/doc-truth-and-detector-hardening`; merge on green CI.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1 | Hardening + emergent modules (ADR-0006) | ✅ merged |
| 2 | Detector hardening + doc truth (honest-review follow-up) | 🔄 PR opening |
| 3 | _your first real feature_ / loupe migration — brings the second adapter that proves port substitutability | ⬜ |

## Open questions

- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Should the README state its audience?** The honest review says the
  template's real product is the agent-operated method; undecided whether the
  README should say so explicitly.
