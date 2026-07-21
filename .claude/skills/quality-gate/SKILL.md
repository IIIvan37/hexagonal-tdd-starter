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

`gate` runs, in order (parallelized by pnpm's script regex):

1. `pnpm typecheck` — `tsc --noEmit`, strict (all `noUnused*`,
   `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
2. `pnpm check` — biome lint + format.
3. `pnpm check:arch` — `sheriff verify`: hexagonal layering on the module graph
   (`core:domain` → nothing, `application` → `domain`, `cli` → `core:api`). Browser
   globals and `node:*` imports in the core are caught by Biome (step 2, override on
   `packages/core`), not by Sheriff.
4. `pnpm test:coverage` — vitest, **100 % thresholds on every file** (statements,
   branches, functions, lines). Test-first means covered, so a drop is a
   regression, not a budget. The only exclusion is `cli/src/main.ts`, the
   `process.exit` boundary, covered by `main.spec.ts` running the real binary.
   Includes `packages/core/src/purity.spec.ts`, the **fitness function** for
   ambient state Biome cannot express (`Math.random()`, `Date.now()`,
   `process.env`, `globalThis.…`).
5. `pnpm check:dead` — knip (orphan exports / dead code). Caveat: `@app/core`'s
   `index.ts` is the package entry, so a **core public export with no consumer
   yet is NOT flagged** — the application README registry and review are the
   guard there.
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
