# hexagonal-tdd-starter

A reusable starter for a **pnpm monorepo** with a **pure hexagonal core**,
**strict TDD**, and a **blocking quality gate** — plus Claude Code skills that
encode the method. Domain-agnostic: it ships one tiny example slice (`greet`) and
nothing else, so you can replace it with your own domain immediately.

## What's in the box

- **Hexagonal layering**, enforced three ways:
  - the package graph (`@app/core` pure ← `@app/cli` adapter),
  - **Sheriff** (`sheriff.config.ts`) on the module graph,
  - **Biome** `noRestricted*` (override on `packages/core`) for the no-I/O /
    no-ambient-state purity invariant Sheriff can't see,
  - a **fitness function** (`packages/core/src/purity.spec.ts`) for what neither
    can express: `Math` is fine, `Math.random()` is not. It tests its own
    detector, so it can't quietly stop working.
- **Errors are values, and they are tags.** The domain returns `Result<T, E>`;
  failures travel as `{ kind: 'empty-name' }`, not as English sentences. The
  adapter (`cli/src/report.ts`) decides the wording, the language and the exit
  code, exhaustively — add a tag and the build breaks until it is handled. A
  `try/catch` wraps one port call, never a use-case body, so a genuine bug still
  crashes instead of arriving as a polite `{ ok: false }`.
- **Parse, don't validate.** `HourOfDay` is branded with a `unique symbol`, so it
  can only be produced by `hourOfDay` — which makes `salutationFor` *total*, with
  no defensive check and no error case to invent.
- **Determinism is part of purity.** No `Date.now()`, `Math.random()`,
  `crypto.randomUUID()`, timers or `process.env` inside the hexagon — inject a
  port that yields the value. `Clock` is the worked example: `SystemClock` reads
  the host, the core gets an `Instant` and does pure arithmetic on it, and a test
  pins time with `FixedClock` instead of hoping CI runs in the morning.
- **Blocking quality gate** (`pnpm gate`): TypeScript strict, Biome lint+format,
  Sheriff, vitest with **100 % coverage thresholds on every file**, knip (dead
  code), jscpd (duplication, threshold 0). Greenfield = no debt tolerated, a
  finding fails the build.
- **Mutation testing** (Stryker, scoped to the pure core) — run locally before the
  PR, and in CI post-merge.
- **TDD strict** with fast-check property tests; one example vertical slice, tested
  at three altitudes that catch different things:
  - **port contracts** (`@app/core/testing`) — written once per port, replayed
    against every implementation, so adapters stay substitutable;
  - **acceptance test** (`cli/src/run.spec.ts`) — the real composition root in
    process, only the process boundary doubled;
  - **binary test** (`cli/src/main.spec.ts`) — the shipped bin under plain `node`.
- **No build step**: the bin runs the `.ts` sources directly through Node's type
  stripping, so the sources stay in the strip-only subset (no parameter properties,
  enums, namespaces, decorators) — an invariant held by a test that runs the real
  binary under plain `node`.
- **Guardrails**: husky `pre-commit` (gate) + `commit-msg` (commitlint), a
  `block-commit-on-main` hook (code needs a branch+PR; docs may go straight to main).
- **CI** (GitHub Actions): gate + commitlint on PRs, mutation post-merge; Dependabot.
- **Claude Code skills**: `/tdd-cycle`, `/new-feature-hexa`, `/quality-gate`,
  `/session-report` (the close-step discipline: report ships in the PR, mutation
  run locally pre-PR).

## Use it

```sh
# scaffold a new project from this template
npx degit <your-org>/hexagonal-tdd-starter my-project
cd my-project
corepack enable
pnpm install
pnpm gate          # everything green
pnpm --filter @app/cli start Ada   # → Good morning, Ada!
```

Requires Node (see `.nvmrc`) and pnpm via Corepack.

## Make it yours

1. Rename the packages (`@app/core`, `@app/cli`) and the root `name`.
2. Replace the `greeting` slice with your domain, **outside-in**: write the
   use-case acceptance test first (`/new-feature-hexa`), let it pull the domain
   into existence (`/tdd-cycle`), then implement the adapter.
3. Adjust the Biome core-purity denylist, the `purity.spec.ts` rules, and the
   Sheriff tags/depRules as your
   layers grow (e.g. add `packages/web`).
4. Keep `docs/STATUS.md` + `docs/sessions/` current via `/session-report`.

## Layout

```
packages/core/src/domain        pure model
packages/core/src/application   use-cases + ports (the registry README lives here)
packages/core/src/testing       port contracts + in-memory fakes (@app/core/testing)
packages/core/src/index.ts      the only public surface adapters import
packages/cli/src/adapters       port implementations (I/O lives here)
packages/cli/src/run.ts         composition root (testable in process)
packages/cli/src/main.ts        entrypoint — the process boundary, nothing else
.claude/skills                  the method, as Claude Code skills
docs/STATUS.md, docs/sessions   resumable project state
```
