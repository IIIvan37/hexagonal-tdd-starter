# Application registry (use-cases + ports)

The single place to look before adding a feature, so ports and use-cases get
**reused, not reinvented** (`/new-feature-hexa`). Keep this in sync.

## Use-cases

| Use-case | Signature | Notes |
|----------|-----------|-------|
| `greet` | `(deps) => Promise<GreetResult>` | Example slice — load a name, build a greeting, emit it. |

## Ports

| Port | Kind | Implemented by |
|------|------|----------------|
| `NameSource` | driving | `cli`: `ArgvNameSource` |
| `GreetingSink` | driven | `cli`: `ConsoleGreetingSink` |
