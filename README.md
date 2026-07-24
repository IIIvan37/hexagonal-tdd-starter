# hexagonal-tdd-starter

A reusable starter for a **pnpm monorepo** with a **pure hexagonal core**,
**strict TDD**, and a **blocking quality gate** — plus Claude Code skills that
encode the method. Domain-agnostic: it ships one tiny example slice (`greet`) and
nothing else, so you can replace it with your own domain immediately.

## Who this is for

This starter optimizes **long-term drift prevention**, not onboarding speed —
the gate runs six blocking checks in pre-commit, coverage is 100 % per file,
duplication has a zero threshold, mutation runs locally before every PR, and
each step closes with a session report. That ceremony pays for itself when the
product is **durable, framework-independent domain logic**: a CLI, a backend,
or a UI that carries a substantial domain — the UI is just another adapter
consuming `@app/core`
([ADR-0007](docs/adr/0007-frontend-agnostic-starter.md): the starter ships
none on purpose, React/Angular/Vue plug in like the CLI does). The method is
designed to be **agent-operated** (the skills encode it), and assumes a team
willing to work test-first.

It is the wrong tool for a prototype, for thin CRUD that mostly delegates to a
remote API, or for a codebase with little logic independent of its framework —
there, the ceremony costs more than it protects.

## What's in the box

- **Hexagonal layering**, enforced three ways:
  - the package graph (`@app/core` pure ← `@app/cli` adapter),
  - **Sheriff** (`sheriff.config.ts`) on the module graph — layers AND
    emergent feature modules: dormant placeholder rules tag any
    `core/src/<feature>/…` folder the moment it exists, features are isolated
    by default (`sameTag` + `shared`), and a feature can never import the
    nursery (see the anatomy below and ADR-0006),
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
  enums, namespaces, decorators) — an invariant held twice: `erasableSyntaxOnly`
  makes `tsc` reject the syntax anywhere in the tree (even in a file no import
  reaches yet), and a test runs the real binary under plain `node`.
- **Guardrails**: husky `pre-commit` (gate) + `commit-msg` (commitlint), a
  `block-commit-on-main` hook (code needs a branch+PR; docs may go straight to main).
- **CI** (GitHub Actions), two tiers: gate + commitlint + dependency audit on
  PRs; mutation and the **Windows gate** post-merge on `main` or on demand
  (`workflow_dispatch`) — portability is checked where the promise is made, not
  on every push. Dependabot for the bumps.
- **Claude Code skills**: `/tdd-cycle`, `/new-feature-hexa`, `/quality-gate`,
  `/session-report` (the close-step discipline: report ships in the PR, mutation
  run locally pre-PR).

## Use it

```sh
# scaffold a new project from this template
npx degit IIIvan37/hexagonal-tdd-starter my-project
cd my-project
corepack enable    # Node 24 only — see the note below for Node ≥ 25
pnpm install
pnpm gate          # everything green
pnpm greet Ada     # → Good {morning,afternoon,evening}, Ada! — the real clock decides
```

Requires Node ≥ 24 (see `.nvmrc`) — not a whim: the bin runs the `.ts` sources
through Node's native type stripping, no build step. **pnpm**: Node 24 still
bundles Corepack, so `corepack enable` is enough; Node ≥ 25 does not ship it
anymore — run `npm install -g corepack && corepack enable` (or install pnpm
directly) before `pnpm install`.

## After cloning: protect `main` on GitHub

The husky hooks and `block-commit-on-main` only guard **your machine**. A
collaborator, or you on another checkout, can push straight to `main` unless the
remote enforces it too:

```sh
gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Quality gate", "Commit messages"]
  },
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "enforce_admins": true,
  "restrictions": null
}
EOF
```

(JSON via `--input` on purpose: `gh api -F` cannot express the `null` that this
endpoint requires for `restrictions`.)

Without this, the local hooks are a convention, not a guarantee.

## Anatomy: skeleton vs example

The `greet` slice is a **worked example, not a feature** — it exists to be read
once and replaced. Every file that belongs to it carries a first-line marker:

```sh
grep -rln "EXAMPLE" packages     # the full list, always current
```

| Marker | Meaning |
|--------|---------|
| `EXAMPLE … DELETE` | dies with the example slice |
| `EXAMPLE CONTENT, SKELETON ROLE` | keep the file, replace its contents: the composition root (`run.ts`), the error mapping (`report.ts`), the index exports, and the three test altitudes |
| `KEEP` | generic skeleton that only *looks* example-adjacent (`shared/result.ts`) |

Everything unmarked (toolchain, hooks, `purity.spec.ts`, `docs/`) is skeleton.

`greet` lives **extracted** (`core/src/greet/{domain,application,testing}`) on
purpose: it shows the end state of the module lifecycle, while the flat
`domain/` and `application/` folders are the **nursery** where your own files
are born. Modules are discovered, not decreed — the signal, the extraction
procedure and the enforcement are
[ADR-0006](docs/adr/0006-emergent-feature-modules.md); `pnpm modules:hint`
points at candidates when the nursery grows.

### Tearing out the example

```sh
pnpm eject:example                          # driven by the markers above
pnpm install && pnpm check:fix && pnpm gate # → green, empty skeleton
```

The script ([scripts/eject-example.ts](scripts/eject-example.ts)) deletes the
`DELETE`-marked files, rewrites the `SKELETON ROLE` ones as minimal stubs — the
three test altitudes stay alive, so the strip-only invariant remains locked even
before your first feature — empties the registry, and removes the two
dependencies knip would rightly flag (`@app/core` in `cli`, `fast-check`;
re-add them the moment a feature needs them). `shared/result.ts` and its spec
are kept: coverage is 100 % per file, a kept file keeps its spec.

Doing it by hand instead? The blind run costs four failed gate passes — follow
the script's source as the checklist.

Then: `/new-feature-hexa`, outside-in.

## Make it yours

1. Rename the packages (`@app/core`, `@app/cli`) and the root `name`.
   The specifier lives in **two places** that must stay in sync: the package
   `exports` (`packages/core/package.json`) — which tsc, vitest and the bin all
   resolve through — and the `paths` in `tsconfig.json`, which exist **only for
   Sheriff** (without them `check:arch` goes green-but-blind on package imports;
   the comment there has the details).
2. Tear out the example (see **Anatomy** above), then build your first real
   slice outside-in (`/new-feature-hexa`, `/tdd-cycle`).
3. Adjust the Biome core-purity denylist, the `purity.spec.ts` rules, and the
   Sheriff tags/depRules as your layers grow. A new adapter package needs BOTH
   its Sheriff tag and a Biome override banning `@app/core/testing` outside
   specs (copy the `packages/cli` one).
4. Keep `docs/STATUS.md` + `docs/sessions/` current via `/session-report`.

## Layout

```
packages/core/src/domain        NURSERY: new domain files are born here, flat
packages/core/src/application   NURSERY: use-cases + ports (+ the registry README)
packages/core/src/shared        the kernel — grows by promotion only (Result lives here)
packages/core/src/greet         an EXTRACTED feature module: {domain,application,testing}
packages/core/src/testing       the @app/core/testing barrel (re-exports feature test kits)
packages/core/src/index.ts      the only public surface adapters import (fitness-checked)
packages/cli/src/adapters       port implementations (I/O lives here)
packages/cli/src/run.ts         composition root (testable in process)
packages/cli/src/main.ts        entrypoint — the process boundary, nothing else
.claude/skills                  the method, as Claude Code skills
docs/STATUS.md                  the present state — bounded, rewritten, never a log
docs/sessions                   rolling window of the 5 last reports (+ archive/)
docs/adr                        why the constraints exist (read before removing one)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the loop and the non-negotiables, and
[docs/adr/](docs/adr/) for the reasoning behind them. Licensed under
[MIT](LICENSE).
