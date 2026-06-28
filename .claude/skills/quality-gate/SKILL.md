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
4. `pnpm test:coverage` — vitest with coverage thresholds on `packages/core`.
5. `pnpm check:dead` — knip (orphan exports / dead code).
6. `pnpm check:dup` — jscpd (copy-paste, threshold 0).

Individual pieces if needed: `pnpm typecheck`, `pnpm check:fix` (biome auto-fix),
`pnpm check:arch`, `pnpm test`, `pnpm check:dead`, `pnpm check:dup`.

## How to read / react

- **typecheck**: zero tolerance. No `as any` to silence — fix the type.
- **check:arch / biome**: a Sheriff violation = a layering leak (bad dependency
  between layers). A Biome `noRestricted*` violation = I/O or a global that slipped
  into `core`. Move the impure code into an adapter behind a port. To add/adjust a
  boundary rule: `sheriff.config.ts` (tags + depRules).
- **knip**: an orphan export = either wire it or delete it. No dead code "just in
  case".
- **jscpd**: a clone = factor into a shared helper (often pure domain). Don't
  duplicate across strategies/variants.

## Before declaring done

- The gate is **green** (exit 0).
- Core coverage holds the thresholds (`vitest.config.ts`).
- If the step is finished (not just verified), close it with `/session-report`.
