---
name: quality-gate
description: Run the blocking quality gate (typecheck + biome + core-purity + tests with coverage + knip dead-code + jscpd duplication) and report. Use before declaring any change done, before a commit, or before opening a PR. Detectors are BLOCKING (greenfield, no debt to absorb) — a finding fails the gate.
---

# Quality gate

Single command, all guardrails, blocking. Unlike a ratchet/report-only setup, a
finding means the change is **not done**. Fix it, don't note it.

## Run

```
pnpm gate
```

`gate` expands (pnpm script regex) to six checks — what each one guards:

1. `pnpm typecheck` — `tsc --noEmit`, strict (all `noUnused*`,
   `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), plus
   `erasableSyntaxOnly`: the strip-only invariant (no `enum`, parameter
   properties, `namespace`, decorators) is rejected by the compiler anywhere
   in the tree — even in a file no import reaches yet; the binary test then
   proves it on the shipped bin.
2. `pnpm check` — biome lint + format.
3. `pnpm check:arch` — `sheriff verify` on the real module graph, two tag
   dimensions (`sheriff.config.ts`, ADR-0006): `layer:*` for the hexagon
   (`domain` → nothing, `application` → `domain`, adapters → `core:api`) and
   `feature:*` from dormant placeholders — features are isolated by default
   and may never import the nursery (the ratchet). Two entry points: the cli
   and the `@app/core/testing` barrel. Browser globals and `node:*` imports in
   the core are caught by Biome (step 2, override on `packages/core`), not by
   Sheriff; spec files are invisible to Sheriff by construction.
4. `pnpm test:coverage` — vitest, **100 % thresholds on every file** (statements,
   branches, functions, lines). Test-first means covered, so a drop is a
   regression, not a budget. The only exclusion is `cli/src/main.ts`, the
   process boundary (it sets `process.exitCode` — never `process.exit()`, which
   would tear down before stdout drains), covered by `main.spec.ts` running the
   real binary. Includes the two **fitness functions**:
   `packages/core/src/purity.spec.ts` for ambient state Biome cannot express
   (`Math.random()`, `Date.now()`, `process.env`, `globalThis.…`) and
   `packages/core/src/public-surface.spec.ts`, which fails on any core value
   export no adapter imports.
5. `pnpm check:dead` — knip (orphan exports / dead code). `@app/core`'s
   `index.ts` is the package entry, so knip cannot flag an unconsumed core
   public export — that gap is closed by `public-surface.spec.ts` (step 4);
   the application README registry stays the human-readable map.
6. `pnpm check:dup` — jscpd (copy-paste). `.jscpd.json` sets **threshold 0**
   (spec files excluded): greenfield, so any clone fails the gate. Factor it
   out — never raise the threshold.

Individual pieces if needed: `pnpm typecheck`, `pnpm check:fix` (biome auto-fix),
`pnpm check:arch`, `pnpm test`, `pnpm check:dead`, `pnpm check:dup`.

## How to read / react

- **typecheck**: zero tolerance. No `as any` to silence — fix the type.
- **check:arch / biome**: a Sheriff violation = a layering leak (bad dependency
  between layers). A Biome `noRestricted*` violation = I/O or a global that slipped
  into `core`. Move the impure code into an adapter behind a port. To add/adjust a
  boundary rule: `sheriff.config.ts` (tags + depRules).
- **purity fitness function**: a failure names the file, the line and the reason.
  The fix is never to loosen the rule — it is to inject a port that yields the
  value (`Clock` is the worked example). Add a rule when a new source of ambient
  state appears.
- **knip**: an orphan export = either wire it or delete it. No dead code "just in
  case".
- **jscpd**: a clone demands a DECISION, not automatically a merge — three
  exits: **factor** (same knowledge, changes together), **mark deliberate**
  (`// jscpd:ignore-start`/`-end` + a one-line reason — coincidental likeness,
  or a boundary crossing like domain type vs adapter DTO), or **when unsure,
  keep the duplication** — the wrong abstraction costs more than the clone
  (Metz), and the test net makes late factoring cheap. Never bump the
  threshold in `.jscpd.json`; never `ignore` without the reason line.

## Before declaring done

- The gate is **green** (exit 0).
- Core coverage holds the thresholds (`vitest.config.ts`).
- If the step is finished (not just verified), close it with `/session-report`.
