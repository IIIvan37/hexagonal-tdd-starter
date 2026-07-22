# ADR 0001 — Ship TypeScript sources, run them under Node's type stripping

- **Status**: accepted
- **Date**: 2026-07-21

## Context

The `greet` bin pointed at `packages/cli/src/main.ts` with a `#!/usr/bin/env node`
shebang, and there was no build step. That worked only by accident: the moment a
source used TypeScript syntax that *emits code*, Node refused the module.

It did. A parameter property in `ArgvNameSource` made the shipped binary
unrunnable, while `pnpm start` (through `tsx`) stayed green — so nothing caught
it.

```
$ node packages/cli/src/main.ts Ada
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property
is not supported in strip-only mode
```

## Decision

Keep the no-build-step setup, and treat the **strip-only subset as an
invariant**: no parameter properties, `enum`, `namespace` or decorators anywhere
in the shipped graph.

Lock it with a test that runs the real binary under `process.execPath`
(`packages/cli/src/main.spec.ts`) — the only check that exercises what a user
actually installs.

## Consequences

- No build, no `dist/`, no artefact drift between what is tested and what ships.
- The constraint is invisible in the type system, so it needs the test to exist.
  Deleting `main.spec.ts` silently re-opens the hole.
- Contributors must know the subset; it is written in `CONTRIBUTING.md` and
  `CLAUDE.md` because a `tsc` error will never tell them.
- Coverage of `main.ts` comes from a subprocess, which v8 cannot instrument — so
  the file is excluded from coverage thresholds, with that reason recorded in
  `vitest.config.ts`.

## Alternatives considered

- **Add a real build step** (`tsc`/`tsdown` → `dist/`, bin points at the output).
  Removes the syntax constraint entirely and is the right call for a published
  package. Rejected here: it adds a build to the gate, an artefact to keep in
  sync, and a class of "works in dev, broken in dist" bugs — a poor trade for a
  starter whose point is the method, not distribution. Revisit when this ships to
  npm.
- **Keep `tsx` as the bin runner.** Makes a dev dependency load-bearing at
  runtime for every consumer. Rejected.
