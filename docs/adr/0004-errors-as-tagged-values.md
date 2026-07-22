# ADR 0004 — Expected failures are tagged values; bugs are left to crash

- **Status**: accepted
- **Date**: 2026-07-21

## Context

The `greet` use-case wrapped its entire body in `try/catch` and returned
`{ ok: false, error: string }`. Three problems, all in the example that every
consumer of this starter copies:

- A `TypeError` in the domain came back as a polite `{ ok: false }`,
  indistinguishable from a business rule. **The one failure that must be loud was
  the quietest.**
- `error: string` gave callers nothing to branch on.
- The domain hardcoded the English wording, leaving the adapter nothing to decide
  but where to print it.

## Decision

- The domain returns `Result<T, E>` (`domain/result.ts`) for expected failures.
  An empty name is untrusted input failing to parse, not an emergency.
- `E` is a **closed union of tags** (`{ kind: 'empty-name' }`), never a sentence.
- `try/catch` wraps a **single port call**, mapped to its own tag. Adapters live
  outside the hexagon and may throw for reasons the core cannot enumerate; nothing
  else is caught, so a genuine bug propagates and crashes.
- Wording, language and exit code are decided by the adapter
  (`packages/cli/src/report.ts`), exhaustively via `exhausted(error: never)`.
- Prefer removing an error case to handling one: `HourOfDay` is branded, so
  `salutationFor` is total and has no error branch at all.

## Consequences

- Adding a tag to `GreetError` breaks the build in `report.ts` until it is
  handled — the compiler enforces exhaustiveness that a `default` branch would
  have hidden.
- An HTTP or GUI adapter maps the same tags to a status code or a toast; the core
  learns about neither.
- More ceremony than `throw`: every call site unwraps a `Result`. That is the
  cost, and it is the point — a caller cannot forget a failure that is in the
  type.
- `Result` is hand-rolled (≈30 lines) rather than taken from neverthrow or
  fp-ts. Deliberate: a starter should be readable end to end, and the type is
  small enough that a dependency would cost more than it saves. Swap it if the
  domain grows combinators.
- A test pins the crash behaviour (a clock that throws `TypeError` must reject,
  not return) — otherwise the blanket catch would creep back in.

## Alternatives considered

- **Throw typed error classes.** Keeps call sites terse, but the failure stays
  out of the signature and `instanceof` checks across a package boundary are
  fragile. Rejected.
- **`error: string` with parsing at the adapter.** String-matching a message to
  choose an exit code is exactly the coupling tags remove.
- **A `Result` library.** See above; revisit when `map`/`andThen` chains appear.
- **`{ __brand: 'hour' }` instead of a `unique symbol`** for `HourOfDay`. More
  readable, but a string-literal brand is structural: two types sharing a literal
  are the same type, and a value can be forged with no cast
  (`Object.assign(99, { __brand: 'hour' })`), which would hand `salutationFor` the
  invalid hour its type promises it will never see. Rejected — the totality of
  `salutationFor` rests entirely on that brand.
