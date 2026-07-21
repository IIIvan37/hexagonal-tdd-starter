# ADR 0003 — Ambient state goes behind a port, and three layers enforce it

- **Status**: accepted
- **Date**: 2026-07-21

## Context

The core-purity guard was a denylist of enumerated globals and imports: `window`,
`fetch`, `process`, `node:fs`… It caught network and filesystem I/O, and let
through the impurity that actually bites day to day — **non-determinism**.
Nothing stopped `Date.now()` or `Math.random()` from being called inside the
hexagon, which is precisely how a domain silently becomes untestable.

Two gaps, of different natures:

1. Missing entries (`Date`, `crypto`, timers, `node:http`…) — fixable by
   extending the list.
2. Something a global-name rule **structurally cannot express**: `Math` is a
   legitimate global, `Math.random()` is not.

## Decision

Treat ambient state — time, randomness, IDs, env config — as I/O: it goes behind
a port. `Clock` is the worked example, and the example slice was extended until
it genuinely needed one, so the port is pulled into existence by a consumer
rather than written speculatively.

The port hands the core an `Instant` (`epochMs` + `offsetMinutes`) rather than a
`Date`, because resolving the machine's timezone is itself environment-dependent.
The adapter does it once, at the boundary; everything after is pure arithmetic.

Enforcement, in three layers:

| Layer | Catches |
|---|---|
| Sheriff | the module graph |
| Biome `noRestricted*` | forbidden globals and imports |
| `packages/core/src/purity.spec.ts` | member expressions the other two cannot see |

## Consequences

- Tests pin time (`FixedClock`) instead of hoping CI runs in the morning.
- The fitness function is a **lexical scanner**, not a type-aware one. It is
  comment-aware, but a trailing `// …` after code can still raise a false
  positive; the documented fix is to reword the comment, never to loosen the
  rule.
- It tests its own detector against synthetic sources — a fitness function nobody
  has seen fail is indistinguishable from one that does nothing.
- Each new source of ambient state needs a new rule added by hand. The list will
  always lag reality slightly.
- The example slice is now time-dependent end to end, so the acceptance test
  asserts a *shape* (`/^Good (morning|afternoon|evening), Ada!$/`). That is
  honest about what that altitude can prove, and it makes the case for the port.

## Alternatives considered

- **Biome only.** Cannot express `Math.random()`. Rejected as insufficient.
- **An ESLint rule (`no-restricted-syntax`) alongside Biome.** Would express it
  precisely, at the cost of a second linter, a second config and a second pass in
  the gate. Rejected: not worth a whole toolchain for one rule.
- **A lint plugin written for this.** Same power, more maintenance than a 40-line
  test that any contributor can read and extend.
- **Trusting review.** This is the class of mistake review misses, because
  `Date.now()` looks harmless at the call site.
