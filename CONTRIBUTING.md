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

The invariants the tooling defends — **stated once, in
[CLAUDE.md](CLAUDE.md)**, which is their canonical wording (this file used to
paraphrase them, and the paraphrase is what drifted). By name:

1. a **pure, deterministic core** (ambient state goes behind a port),
2. **outside-in** (no speculative domain code),
3. **expected failures are values, bugs crash** (tagged `Result`, exhaustive
   adapter mapping),
4. **parse, don't validate** — plus **contract-tested ports** and **strip-only
   TypeScript** (see Conventions there).

If one of them blocks you, the answer is never to widen the rule — read the
matching [docs/adr/](docs/adr/) entry for why it exists.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint in a `commit-msg` hook and in CI.

```
feat(core): add the Clock port
fix(cli): make the bin runnable under plain node
chore(config): raise coverage thresholds to 100
```

**Structural ≠ behavioral** (Beck, *Tidy First?*): a commit either changes what
the code does (`feat:`, `fix:`) or how it is arranged (`refactor:`) — never
both. A `refactor:` diff must review as "nothing observable changed"; the
moment a rename rides along with a feature, the reviewer can verify neither.
The TDD loop gives the natural seam: commit on green, then tidy, then commit
the tidying.

**Keep batches small.** A stacked-PR chain is a transitional state, not a way
of life: past 2–3 unmerged PRs, every change to the bottom rebases everything
above and integration stops being continuous. Merge fast, stack shallow.
(This repo violated its own rule once — an 8-PR stack under a CI outage; it
worked, and it is still the anti-pattern.)

## Adding an architectural decision

Anything that changes a boundary, an invariant or the toolchain gets an entry in
[docs/adr/](docs/adr/) — copy `_TEMPLATE.md`. The point is to record *why*, so
the next reader does not "simplify" a constraint that was load-bearing.

## The ideas behind the rules

None of the rules here are original; each borrows from a named practice, so
disagreements can be argued against the source rather than against taste:

- **Red → green → refactor, and structural ≠ behavioral commits** — Kent Beck,
  *Test-Driven Development* and *Tidy First?*.
- **"Duplication is far cheaper than the wrong abstraction"** — Sandi Metz;
  with Fowler's *rule of three*. Behind the jscpd three-exits doctrine.
- **DRY is about knowledge, not text** — Hunt & Thomas, *The Pragmatic
  Programmer*. Why a domain type and an identical-looking DTO stay separate.
- **Listen to the tests** — Freeman & Pryce, *Growing Object-Oriented
  Software, Guided by Tests*. A painful test is design feedback.
- **Deep modules** (small interface, large implementation) and **define errors
  out of existence** — John Ousterhout, *A Philosophy of Software Design*.
  Behind the extraction checklist and the branded `HourOfDay`.
- **Mikado method** — Ellnestam & Brolund. The gate-enumerated module
  extraction in [ADR-0006](docs/adr/0006-emergent-feature-modules.md) is a
  Mikado loop with Sheriff drawing the prerequisite graph.
- **Hyrum's Law** — every observable behavior will be depended upon. Why the
  core's public surface stays minimal and consumer-justified.
- **Evolutionary architecture fitness functions** — Ford, Parsons & Kua. Why
  invariants live as executable specs (`purity.spec.ts`, `docs.spec.ts`)
  rather than review checklists.
