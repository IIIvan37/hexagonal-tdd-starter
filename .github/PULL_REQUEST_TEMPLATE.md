<!--
Describe the PROBLEM first, then the change. A reviewer who does not know why
cannot tell whether the how is right.
-->

## Problem

## Changes

## Checklist

- [ ] Tests written **first** (red → green → refactor)
- [ ] `pnpm gate` green (typecheck, Biome, Sheriff, 100 % coverage, knip, jscpd)
- [ ] `pnpm test:mutation` run locally — score reported below
- [ ] New port? contract + in-memory fake added to `@app/core/testing`, and the
      adapter spec replays the contract rather than restating it
- [ ] New use-case/port registered in `packages/core/src/application/README.md`
- [ ] Boundary, invariant or toolchain changed? an ADR added under `docs/adr/`
- [ ] `/session-report` run — `docs/STATUS.md` updated, dated report included

## Results

<!-- Mutation score, coverage, anything measured rather than asserted. -->
