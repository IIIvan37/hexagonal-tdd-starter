# Contributing

This repository is a **method as much as a codebase**. The rules below are not
style preferences — each one is enforced by a tool, and the tools are what make
the method survive contact with a deadline.

> **About the `/slash-commands` below**: `/tdd-cycle`, `/new-feature-hexa`,
> `/quality-gate` and `/session-report` are [Claude Code](https://claude.com/claude-code)
> skills. Without Claude Code they are still the method — each one is a plain
> markdown checklist in [.claude/skills/](.claude/skills/), written to be
> followed by a human.

## Setup

```sh
corepack enable
pnpm install          # installs the husky hooks via `prepare`
pnpm gate             # everything must be green before you start
```

Node comes from [`.nvmrc`](.nvmrc); pnpm from Corepack.

## The loop

1. **Branch.** Every change gets its own branch, merged via PR. A commit-time
   hook refuses code on `main` (docs-only commits are exempt).
2. **Write the failing test first** (`/tdd-cycle`). For a new feature, start from
   the acceptance test (`/new-feature-hexa`) and let it pull the domain into
   existence. Never write core code without a red test.
3. **`pnpm gate`** — typecheck, Biome, Sheriff, tests at 100 % coverage, knip,
   jscpd. Blocking, and it also runs in `pre-commit`.

   **Consequence, stated plainly: a red or uncovered tree cannot be committed.**
   That is the method (red → green → refactor happens in the working tree, only
   green states get committed). For a genuine exception — an exploratory spike,
   a WIP checkpoint before switching machines — `git commit --no-verify` on a
   feature branch is tolerated: CI re-runs the full gate on the PR, and `main`
   is protected regardless. Never `--no-verify` on `main`, and never merge a PR
   whose gate is red.
4. **`pnpm test:mutation`** before opening the PR. Coverage says a line ran;
   mutation says a test would have noticed it change.
5. **`/session-report`** — the report ships inside the PR.

## Non-negotiables

These are the invariants the tooling defends. If one blocks you, the answer is
never to widen the rule — see [CLAUDE.md](CLAUDE.md) for the reasoning.

- **The core is pure.** No I/O, no browser globals, no `node:*`. And no ambient
  state: `Date.now()`, `Math.random()`, timers and `process.env` are banned
  inside the hexagon — inject a port that yields the value (`Clock` is the
  worked example).
- **Ports are contract-tested.** Obligations live once in
  `packages/core/src/testing/port-contracts.ts` and are replayed by each adapter
  spec. Never restate them; never hand-roll a fake that `@app/core/testing`
  already provides.
- **Expected failures are values; bugs crash.** The domain returns
  `Result<T, E>` with error **tags**, never sentences. `try/catch` wraps one port
  call, never a use-case body.
- **Strip-only TypeScript.** The bin runs the `.ts` sources through Node's type
  stripping: no parameter properties, `enum`, `namespace` or decorators.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint in a `commit-msg` hook and in CI.

```
feat(core): add the Clock port
fix(cli): make the bin runnable under plain node
chore(config): raise coverage thresholds to 100
```

## Adding an architectural decision

Anything that changes a boundary, an invariant or the toolchain gets an entry in
[docs/adr/](docs/adr/) — copy `_TEMPLATE.md`. The point is to record *why*, so
the next reader does not "simplify" a constraint that was load-bearing.
