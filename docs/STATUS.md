# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: starter hardened. A 7-PR stack is open, reviewed and green locally,
  waiting to be merged into `main`.
- **Branch**: `fix/dx-hardening` (tip of the stack, 8 PRs).
- **Packages**: `@app/core` (pure hexagon, plus `@app/core/testing` for the port
  contracts and fakes) and `@app/cli` (adapters). Add `packages/web` as needed.
- **Health**: 109 tests, 100 % coverage, 100 % mutation score (62 mutants).
  **CI has verified none of it** — GitHub Actions is blocked on account billing
  since 2026-07-17, which predates this work.

## Next action

Settle the three open decisions of
[ADR-0006](adr/0006-emergent-feature-modules.md) (emergent feature modules:
greet placement, sequencing, `modules:hint`), then implement them as PR9.
In parallel: unblock Actions billing, merge the stack **#10 → … → #17** in
order, then Dependabot #9 (`ci.yml` conflict expected) and #8.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 0 | Starter bootstrapped (monorepo, toolchain, guardrails, example slice) | ✅ |
| 1 | Hardening: runnable bin, contracts, `Clock`, typed errors, bounded docs, DX (ejectable example, fakes ban, safe pre-commit) | 🔄 stack open |
| 2 | _your first real feature_ | ⬜ |

## Open questions

- **Does the suite pass on Windows?** #15 adds it to the CI matrix, but that
  matrix has never run. The path bug it targets was real; the rest is unverified.
- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Module boundaries**: strategy proposed in
  [ADR-0006](adr/0006-emergent-feature-modules.md), three decisions open before
  PR9 (example placement, sequencing, discovery aid).
- **Public-surface fitness function**: assert every `core/src/index.ts` export
  has a consumer outside the core (closes the documented knip blind spot).
  Doctrine written; the spec itself is code — pair it with PR9.
