---
name: tdd-cycle
description: Drive a change through strict red-green-refactor TDD. Use for ANY change to @app/core (domain or use-cases) and any pure logic — write the failing test first, the minimal code to pass, then refactor under green. Enforces the TDD-strict invariant.
---

# TDD cycle (red → green → refactor)

The core is pure (no I/O) by design — there is no excuse to write code before a
test. One micro-cycle per behavior. Never write production code without a failing
test that demands it. Two disciplines are non-negotiable: **one assertion per
test** and **triangulation** (don't generalize the code until a test forces it).

**Double loop (outside-in).** This unit cycle is the INNER loop. Domain work is
only justified by an OUTER acceptance/use-case test that demands it (see
`new-feature-hexa`). Don't add a domain function no consumer asks for — the domain
is a supplier, pulled into existence by a real need, never pushed "just in case".
If you can't name the failing outer test that requires a piece of domain code,
don't write it.

## RED — write one failing test first

- Colocate: `packages/<pkg>/src/<...>/<name>.spec.ts` next to the unit.
- **One assertion per test.** A test pins exactly ONE behavior and ends in a
  single `expect`. A second fact = a second test. (Arrange/act may be shared via a
  helper; the *assertion* is singular.) A property test counts as one assertion:
  one invariant per `it`.
- Name the test by the rule, not the function (`rejects an empty name`). The name
  should read as the single fact being asserted.
- For pure domain logic, assert on returned values — no mocks.
- For a use-case, inject **fake ports** (in-memory stubs); one `it` asserts the
  `Result`, a separate `it` asserts what the fake received. No real fs/network.
- For an invariant that must hold for all inputs, reach for **fast-check** property
  tests.
- Run and SEE IT FAIL for the right reason: `pnpm test -- <path-or-name>`.
  A test that passes immediately tested nothing — fix it before continuing.

## GREEN — minimal code to pass (fake it, then triangulate)

Take the **smallest** step that goes green, even if it looks absurd:

1. **Fake it.** Return a hardcoded constant if that's all the current test demands.
2. **Triangulate.** Add the next RED test with a *different* example the fake can't
   satisfy. Only now write enough real logic to pass both. Repeat until the general
   rule is forced out by the tests, not by guesswork.
3. Generalize **only** when ≥2 concrete examples require it. No speculative
   branches, no handling cases no test asks for.

Keep `core` pure: if you reach for `node:*`, `window`, or fs, the logic is in the
wrong layer — put a port in `application/ports.ts` and the impl in an adapter.
Biome (`noRestricted*` on `packages/core`) catches the leak; Sheriff catches a bad
cross-layer dependency.

## REFACTOR — clean under green

- Improve names/structure/duplication with the tests as a safety net.
- `jscpd` is blocking (threshold 0): factor any copy-paste into a shared helper.
- Tests must stay green. If you change behavior, that's a new RED.

## Close the cycle

- Run the full gate before declaring done: `/quality-gate`.
- End of step (not just cycle): `/session-report`.

## Anti-patterns (stop if you catch yourself)

- **Multiple assertions in one test** — split into one `it` per fact.
- **Skipping triangulation** — jumping to the general algorithm before two examples
  force it.
- **Speculative domain code** — a domain unit no outer test demands. Name the
  consumer or don't build the supplier.
- Writing the implementation, then the test (delete and restart RED).
- A spec with no failing phase.
- Mocking the domain. The domain is pure; only ports get faked.
- Disabling a detector or loosening a type to go green.
