# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: starter hardened. A 7-PR stack is open, reviewed and green locally,
  waiting to be merged into `main`.
- **Branch**: `fix/bounded-project-state` (tip of the stack).
- **Packages**: `@app/core` (pure hexagon, plus `@app/core/testing` for the port
  contracts and fakes) and `@app/cli` (adapters). Add `packages/web` as needed.
- **Health**: 109 tests, 100 % coverage, 100 % mutation score (62 mutants).
  **CI has verified none of it** — GitHub Actions is blocked on account billing
  since 2026-07-17, which predates this work.

## Next action

Merge the stack in order **#10 → #11 → #12 → #13 → #14 → #15 → #16**, then the
Dependabot PRs #9 (expect a `ci.yml` conflict with #15) and #8. Unblock Actions
billing first, or nothing is verified remotely.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 0 | Starter bootstrapped (monorepo, toolchain, guardrails, example slice) | ✅ |
| 1 | Hardening: runnable bin, port contracts, `Clock`, typed errors, bounded docs | 🔄 stack open |
| 2 | _your first real feature_ | ⬜ |

## Open questions

- **Does the suite pass on Windows?** #15 adds it to the CI matrix, but that
  matrix has never run. The path bug it targets was real; the rest is unverified.
- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
