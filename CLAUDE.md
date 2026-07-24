# CLAUDE.md

Guidance for Claude Code (and any contributor) working in this repository.

## What this is

A **reusable starter**: a pnpm monorepo with a **pure hexagonal core** + adapters,
**TDD-strict**, and a blocking quality gate. It ships one example vertical slice
(`greet <name>`) to prove the toolchain and the method; replace it with your
domain.

## Commands

- `pnpm gate` — **the blocking quality gate**: typecheck → biome → `check:arch`
  (Sheriff) → tests with coverage → knip → jscpd. Run before declaring anything done.
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` — vitest (`*.spec.ts`,
  colocated). Run one: `pnpm test -- <path-or-name>`.
- `pnpm test:mutation` — Stryker, scoped to `@app/core`. **Run it locally at each
  close-step, before opening the PR** (wired into `/session-report`). Also runs in
  CI post-merge. Kept out of `gate` (too slow per commit).
- `pnpm typecheck` / `pnpm check` / `pnpm check:fix` / `pnpm check:arch`
  / `pnpm check:dead` / `pnpm check:dup`.
- Run the example: `pnpm greet <name>`.
- `pnpm modules:hint` — module candidates in the nursery (hint, never a verdict).
- `pnpm arch:map` — regenerate `docs/ARCHITECTURE.md` (module-level Mermaid map
  from Sheriff's own graph). The gate fails when the committed map drifts from
  the tree — regenerate in the same commit that reshapes the graph.

## Architecture (hexagonal)

```
packages/
  core/   — pure hexagon, no I/O.
            src/domain + src/application — the NURSERY: new files are born flat
              here; a module is extracted when it becomes apparent (ADR-0006).
            src/<feature>/{domain,application,testing} — extracted feature
              modules (`greet` is the worked example); Sheriff placeholders tag
              them automatically, features are isolated by default and may
              NEVER import the nursery.
            src/shared — the kernel; grows by promotion (2nd consumer) only.
            src/index.ts — the only public surface adapters import; a fitness
              function (public-surface.spec.ts) fails the gate on any value
              export without an external consumer.
            src/testing (@app/core/testing) — barrel over feature test kits,
              consumed by adapter SPECS only, never by production code.
  cli/     — Node adapters implementing the ports, composition root (src/run.ts),
            entrypoint (src/main.ts — the process boundary, nothing else).
```

Dependency direction: `application → domain`; adapters depend only on `@app/core`'s
public API. Enforced at three levels: the package graph, **Sheriff**
(`sheriff.config.ts`), **Biome** (`noRestrictedGlobals` + `noRestrictedImports`
override on `packages/core`) for the no-I/O / no-ambient-state invariant Sheriff
can't see, and a **fitness function** (`packages/core/src/purity.spec.ts`) for the
member expressions Biome can't express — `Math` is legitimate, `Math.random()` is
not.

## Invariants — do not violate

1. **Pure, agnostic core.** No I/O, no `window`/`fetch`/`fs`/`process` in the
   algorithms. Values in, values out. Impure code lives in an adapter behind a port.
   **Determinism counts as purity**: no `Date`/`Date.now()`, `Math.random()`,
   `crypto.randomUUID()`, timers or `process.env` in the core — inject a port that
   yields the value (`Clock` is the worked example). Enforced by Biome for globals
   and imports, and by the fitness function in `packages/core/src/purity.spec.ts`
   for member expressions Biome cannot express (`Math.random()`).
2. **Outside-in.** The domain is a supplier, pulled into existence by a consumer
   need (a use-case / acceptance test) — never written speculatively.
3. **Expected failures are values; bugs crash.** The domain returns
   `Result<T, E>` (`shared/result.ts`), never throws for a business rule. Errors
   are **tags** (`{ kind: 'empty-name' }`), never sentences — the adapter owns
   the wording, the language and the exit code (`cli/src/report.ts`, exhaustive
   via `exhausted(error: never)`). `try/catch` wraps a **single port call**, never
   a whole use-case body: a blanket catch disguises a `TypeError` as a business
   outcome.
4. **Parse, don't validate.** Prefer making illegal states unrepresentable over
   defensive checks — `HourOfDay` is branded (`unique symbol`) so `salutationFor`
   is total and has no error branch to test.

## Working method

- **TDD strict** (`/tdd-cycle`): red → green → refactor; never write core code
  without a failing test. Property tests (fast-check) for invariants.
- **Ports are contract-tested.** Port obligations are written once in the
  feature's `testing/` folder and replayed by each adapter's spec via a factory
  (one import path for adapters: the `@app/core/testing` barrel). Never restate port assertions in an adapter spec; never
  hand-roll a fake when `@app/core/testing` has one.
- **New feature** = a hexagonal vertical slice (`/new-feature-hexa`): pure domain +
  use-case/port in `core`, adapter in `cli`; register it in
  [packages/core/src/application/README.md](packages/core/src/application/README.md).
- **Close every step** with `/session-report` (rewrites `docs/STATUS.md` + a dated
  report under `docs/sessions/`). The report ships **inside** the feature's PR.
- **Project state is bounded** (`docs/docs.spec.ts`, in the gate). `STATUS.md` is
  a snapshot of the present (≤ 60 lines), never a log; `docs/sessions/` is a
  rolling window of 5, older reports `git mv`'d to `sessions/archive/`; durable
  decisions go to `docs/adr/`, indexed by subject. If a bound fails, move content
  out — never raise the bound.

## Conventions

- Code comments and test names in **English**. File names **kebab-case**.
- **Strip-only TypeScript.** The `greet` bin points at the `.ts` sources, which Node
  runs through type stripping. No syntax that emits code — no parameter properties,
  `enum`, `namespace`, or decorators. Locked by `packages/cli/src/main.spec.ts`,
  which runs the real binary under plain `node`.
- **Conventional Commits** (enforced by commitlint + the husky `commit-msg` hook).
- **Each feature gets its own branch**, merged via PR — never commit a feature
  directly to `main` (enforced by `.claude/hooks/block-commit-on-main.sh`).
  - **Doc-only exception**: a commit whose every change is documentation (`*.md` or
    `docs/**`) may land directly on `main`.
