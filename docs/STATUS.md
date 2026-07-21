# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: fresh starter. Monorepo, toolchain and blocking guardrails in place;
  one example hexagonal vertical slice runs end-to-end (`greet <name>`).
- **Branch**: `main` (clean).
- **Packages**: `@app/core` (pure hexagon, plus `@app/core/testing` for the port
  contracts and fakes) and `@app/cli` (adapters). Add `packages/web` as needed.

## Next action

Replace the `greeting` example slice with your real domain, outside-in
(`/new-feature-hexa`): write the use-case acceptance test first, let it pull the
domain into existence, then implement the adapter.

## Current milestone

Only the milestone in flight and the next one. Collapse finished milestones to a
single line — `git log` and the session reports hold the detail.

| Step | Description | Status |
|------|-------------|--------|
| 0 | Starter bootstrapped (monorepo, toolchain, guardrails, example slice) | ✅ |
| 1 | _your first real feature_ | ⬜ |

## Open questions

Genuinely undecided, blocking or ambiguous. Delete each one the moment it is
resolved: a resolved question is either an [ADR](adr/) or nothing at all.

- _(none)_
