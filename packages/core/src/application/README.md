# Application registry (use-cases + ports)

The single place to look before adding a feature, so ports and use-cases get
**reused, not reinvented** (`/new-feature-hexa`). Keep this in sync.

## Use-cases

| Use-case | Signature | Notes |
|----------|-----------|-------|
| `greet` | `(deps) => Promise<GreetResult>` | Example slice — load a name, build a greeting, emit it. |

## Ports

| Port | Kind | Contract | Implemented by |
|------|------|----------|----------------|
| `NameSource` | driving | `nameSourceContract` | `cli`: `ArgvNameSource` · `InMemoryNameSource`, `FailingNameSource` (fakes) |
| `GreetingSink` | driven | `greetingSinkContract` | `cli`: `ConsoleGreetingSink` · `InMemoryGreetingSink` (fake) |

## Test support (`@app/core/testing`)

Every port owns a **contract** — the obligations an adapter must honour, written
once and replayed against each implementation, so adapters stay substitutable.
Lives in [../testing/port-contracts.ts](../testing/port-contracts.ts), validated
against the in-memory reference implementations in
[../testing/in-memory-adapters.ts](../testing/in-memory-adapters.ts).

Adding a port? Add its contract and its in-memory fake in the same step, and list
them above. Adding an adapter? Call the contract with a factory — never rewrite
port assertions in an adapter spec.

This module is deliberately outside `src/index.ts`: production code cannot import
a fake, and it is the only part of the core allowed to depend on vitest.
