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
    no-browser-global purity invariant Sheriff can't see.
- **Blocking quality gate** (`pnpm gate`): TypeScript strict, Biome lint+format,
  Sheriff, vitest with coverage thresholds, knip (dead code), jscpd (duplication,
  threshold 0). Greenfield = no debt tolerated, a finding fails the build.
- **Mutation testing** (Stryker, scoped to the pure core) — run locally before the
  PR, and in CI post-merge.
- **TDD strict** with fast-check property tests; one example vertical slice.
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
pnpm --filter @app/cli start Ada   # → Hello, Ada!
```

Requires Node (see `.nvmrc`) and pnpm via Corepack.

## Make it yours

1. Rename the packages (`@app/core`, `@app/cli`) and the root `name`.
2. Replace the `greeting` slice with your domain, **outside-in**: write the
   use-case acceptance test first (`/new-feature-hexa`), let it pull the domain
   into existence (`/tdd-cycle`), then implement the adapter.
3. Adjust the Biome core-purity denylist and the Sheriff tags/depRules as your
   layers grow (e.g. add `packages/web`).
4. Keep `docs/STATUS.md` + `docs/sessions/` current via `/session-report`.

## Layout

```
packages/core/src/domain        pure model
packages/core/src/application   use-cases + ports (the registry README lives here)
packages/core/src/index.ts      the only public surface adapters import
packages/cli/src/adapters       port implementations (I/O lives here)
packages/cli/src/main.ts        composition root / entrypoint
.claude/skills                  the method, as Claude Code skills
docs/STATUS.md, docs/sessions   resumable project state
```
