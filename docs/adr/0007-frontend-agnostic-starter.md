# ADR 0007 — Keep the starter frontend-agnostic; a UI is an adapter the consuming project owns

- **Status**: accepted
- **Date**: 2026-07-24

## Context

With the toolchain and the method stabilised, the question came up of adding
frontend-specific rules — the double loop of outside-in TDD
([outsidein.dev](https://outsidein.dev/concepts/outside-in-tdd)): an acceptance
test at the UI boundary stays red while unit-level red-green-refactor cycles
build what it needs. The starter already encodes the inner half (the domain is
pulled into existence by a consumer need); the outer loop currently stops at
the port, because the only shipped adapter is a CLI.

Shipping a frontend worked example runs into [ADR-0001](0001-strip-only-typescript-no-build-step.md):
any mainstream frontend framework (JSX) requires a build step. A vanilla-DOM
example would keep ADR-0001 intact but demonstrate a frontend nobody ships,
while nudging the starter toward blessing one framework — against its stated
purpose of being replaced by your domain.

## Decision

The starter ships **no frontend package**. Specialising — adding a web (or
mobile, or desktop) adapter — is the consuming project's responsibility.

What the starter asserts is that **a UI is just another adapter**, and the
existing invariants already say how to build one:

- **Humble component.** A component renders values and dispatches intents to
  core use-cases; no business logic in the view. Wording, i18n and error
  rendering belong to the adapter, exhaustively over error tags
  ([ADR-0004](0004-errors-as-tagged-values.md)) — the web counterpart of
  `cli/src/report.ts`.
- **Browser ambient state goes behind ports**
  ([ADR-0003](0003-ambient-state-behind-ports.md)): `fetch`, storage,
  navigation, timers — same treatment as `Clock`. The adapter replays the port
  contracts from `@app/core/testing`
  ([ADR-0002](0002-port-contracts-in-a-testing-subpath.md)) like any other.
- **View state lives in the adapter; domain state transitions are pure
  functions in the core** — reducer-style, property-testable with the existing
  tooling.
- **Double loop.** A UI acceptance test (component-level, in-process) is the
  outer loop; `/tdd-cycle` is the inner one. Heavy end-to-end suites stay out
  of the gate, run at close-step — the same placement as mutation testing.

## Consequences

- The starter stays framework-agnostic and ADR-0001 stays intact; there is no
  second worked example to maintain and upgrade.
- The frontend rules above are **documented, not enforced or demonstrated**. A
  project adding `packages/web` must wire it into Sheriff and the package graph
  itself (depend only on `@app/core`'s public surface, never the nursery) —
  the rules exist, the package entry does not.
- There is no executable proof that the method transposes to a UI; this ADR is
  the only guidance. If that proof turns out to be needed, it belongs in a
  separate demo repository consuming the starter, not in the starter.

## Alternatives considered

- **A vanilla-DOM `packages/web` worked example (no build step).** Keeps
  ADR-0001, proves port reuse — but demonstrates a frontend style nobody
  would ship, for a real maintenance cost. Weak proof, full price. Rejected.
- **A framework adapter with Vite scoped to the web package.** Representative
  of real projects, but requires amending ADR-0001 and blesses one framework
  in a starter whose slice is meant to be deleted. Rejected.
- **Frontend rules in CLAUDE.md with no ADR.** Rules whose reasoning is not
  recorded are the first thing a later reader "simplifies away" — the exact
  failure this directory exists to prevent. Rejected.
