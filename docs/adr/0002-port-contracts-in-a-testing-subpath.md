# ADR 0002 — Port obligations live in contracts, shipped from `@app/core/testing`

- **Status**: accepted
- **Date**: 2026-07-21

## Context

The hexagon's central claim is that adapters are **substitutable**: the core does
not care which `GreetingSink` it got. Nothing tested that claim. Adapter specs
each asserted their own ad-hoc expectations, and every use-case spec hand-rolled
its own fake sink — so the same obligation was restated, differently, in several
places, and no two implementations were ever held to the same bar.

A unit test of one adapter proves that adapter behaves. It cannot prove
substitutability, which is a property of the *set* of implementations.

## Decision

Write each port's obligations **once**, as a reusable suite parameterised by a
factory, and replay it against every implementation:

```ts
nameSourceContract('ArgvNameSource', () => ({
  source: new ArgvNameSource('Ada'),
  expectedName: 'Ada'
}))
```

They live in `packages/core/src/testing`, exposed as the `@app/core/testing`
subpath — deliberately **not** re-exported from `src/index.ts`. The same module
ships the in-memory reference implementations, which the contracts are validated
against: a contract the reference fails is a bug in the contract.

Sheriff gets a `core:testing` tag reachable from adapters and from no production
layer.

## Consequences

- Adding an adapter means calling the contract, not inventing port tests. Adding
  a port means writing its contract and its fake in the same step.
- Production code **cannot** import a fake — enforced by two different tools,
  because neither covers both cases alone: Sheriff keeps every core production
  tag away from `core:testing`, but its `cli` tag covers the whole package and
  cannot exempt spec files, so for cli the rule is a Biome `noRestrictedImports`
  override (`packages/cli/src/**`, `!**/*.spec.ts`). Adding an adapter package
  means adding both its Sheriff tag **and** its Biome override — the checklist
  in `/new-feature-hexa` says so.
- This is the only part of the core allowed to depend on vitest, which is a real
  wart: the "pure" package now has a test-framework dependency in one corner.
  Accepted because the alternative (a fourth package) costs more than it saves at
  this size.
- Contracts must stay minimal. Anything specific to one adapter (argv parsing,
  stdout formatting) belongs in that adapter's own spec — a contract that grows
  adapter-specific assertions stops being a contract.

## Alternatives considered

- **A separate `@app/testing` package.** Cleaner dependency story, no vitest in
  `core`. Rejected for now: a package whose only content is three fakes and three
  suites is ceremony. Revisit if the testing surface grows.
- **Contracts next to each adapter, copied.** What we had. Guarantees drift.
- **Export the contracts from `src/index.ts`.** Simplest wiring, but it puts
  fakes on the production surface — exactly what this decision is preventing.
