# STATUS

> Resumable source of truth. Updated at the end of each step via `/session-report`.

## Where we are

- **Phase**: fresh starter. pnpm monorepo + toolchain + blocking guardrails in
  place; one example hexagonal vertical slice runs end-to-end (`greet <name>`).
- **Branch**: `main` (clean).
- **Packages**: `@app/core` (pure hexagon) + `@app/cli` (adapter). Add
  `packages/web` or others as the project grows.

## Next step

Replace the `greeting` example slice with your real domain, outside-in
(`/new-feature-hexa`): write the use-case acceptance test first, let it pull the
domain into existence, then implement the adapter.

## Roadmap

| Step | Description | Status |
|------|-------------|--------|
| 0 | Starter bootstrapped (monorepo, toolchain, guardrails, example slice) | ✅ |
| 1 | _your first real feature_ | ⬜ |

## Session journal

Dated reports under [docs/sessions/](sessions/). Most recent on top.

- _(none yet)_
