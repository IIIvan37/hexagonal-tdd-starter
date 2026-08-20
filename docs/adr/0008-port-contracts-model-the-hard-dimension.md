# ADR 0008 — A port contract models the dimension its implementations differ on

- **Status**: accepted
- **Date**: 2026-08-20

## Context

[ADR-0002](0002-port-contracts-in-a-testing-subpath.md) made substitutability
testable: a port's obligations are written once and replayed against every
implementation. A module-depth review of a field project built on this starter
(2026-08) found two failures that the contract could not have caught — because
the gap is in the contract, not in the adapters.

**A conformant fake that erases the difficulty.** One port had five
implementations and four fakes; every fake resolved instantly
(`load: vi.fn(async () => {})`). But *when* that port resolves is its whole
difficulty: the caller flipped a synchronous "ready" flag before the audio graph
was connected, and playing inside that window started silent sources. The
contract passed. The fakes were conformant. Nothing in the kit could open the
window, so no test could.

**A guarantee the port never wrote down.** A caller depended on the adapter
clearing its gains *before* its first `await`. A conformant adapter clearing
them after would silently erase every restored fader. The contract asserted the
settled state, and the settled state was identical either way.

The starter carries the same shape in its worked example:
`InMemoryNameSource.load()` and `InMemoryGreetingSink.save()` are `async` and
resolve unconditionally. No test can say "the load is in flight".

The root is one sentence: **a contract that asserts values after settlement
proves the port's shape, not its behaviour in time.** Substitutability is a
property of the set of implementations, and the dimension real implementations
differ on — latency, ordering, partial failure — is precisely the one a
convenient reference fake erases.

## Decision

A port's contract models the dimension its implementations actually differ on,
and the reference fake lets a test drive that dimension.

- **Asynchronous port** — the reference fake exposes controllable settlement
  (the test decides when it resolves), and the contract carries at least one
  in-flight assertion.
- **Ordering a caller relies on** — written into the contract, never into a
  comment next to the call site.

Mechanically, a **dormant** fitness function: it fails when an asynchronous port
with **two or more real adapters** has a reference fake that resolves
unconditionally. The threshold is not arbitrary — one adapter is a hypothetical
seam, two is a real one. Below it the controllable fake has no consumer, and
writing it anyway would break the outside-in invariant (a supplier is pulled
into existence by a consumer, never written speculatively). On `greet` the
detector is silent; it fires the day a project grows a genuine second adapter.

## Consequences

- The class of bug this catches — **conformant adapter, broken caller** — was
  previously invisible to every tool in the gate. Sheriff sees the graph, the
  contract sees the settled values, and neither sees the window between them.
- The detector cannot be proven against this repo's own tree, since no port here
  has two real adapters. It is proven against inline fixtures, the way
  `port-discipline.spec.ts` and `variant-discipline.spec.ts` already test their
  own detectors. A detector that only ever passes is not evidence.
- **`greet`'s fakes stay degenerate**, and that is a real cost: a reader who
  copies `InMemoryNameSource` as a model copies the shape this ADR rejects. The
  kit carries an `ADR 0008` pointer saying so — `adr-pointers.spec.ts` keeps the
  pointer from going stale.
- Adding an asynchronous port to a project with a real seam now costs more: the
  fake has to be built for control, not for brevity. That is the point.

## Alternatives considered

- **Make `greet`'s fakes controllable now.** Shows the shape in the worked
  example, the way `Clock` shows the shape of ambient state. Rejected: `greet`
  is a one-shot CLI with no concurrency, so a controllable fake would be a
  supplier without a consumer — the invariant the whole method rests on.
- **Allowlist `greet` in the detector.** Rejected: an allowlist on the worked
  example becomes a lie the moment someone copies `greet` to start their first
  real feature, which is exactly what the example is for.
- **Prose only** — a line in the `/new-feature-hexa` checklist. The prose ships
  either way, but rejected as the *only* measure: this discipline already failed
  once, in a project written with the method in view. Discipline is what fails.
- **Require every fake to be controllable, regardless of adapter count.**
  Rejected: it turns every one-adapter port into ceremony, and a rule that fires
  where it cannot pay gets waived, then ignored.
