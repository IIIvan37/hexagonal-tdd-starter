# Domain docs

How an agent exploring this repo should find its vocabulary. Layout:
**single-context** — the hexagon in `packages/core` is the one context, every
adapter package is its boundary, and `docs/adr/` is transverse to both.

## Read these before exploring

- **`packages/core/src/<feature>/domain/`** — the extracted feature modules.
  The domain types *are* the glossary: `HourOfDay` is branded so illegal states
  cannot be built, and the branding is the definition.
- **`packages/core/src/domain/` and `packages/core/src/application/`** — the
  nurseries, where new files are born flat before a module becomes apparent
  ([ADR-0006](../adr/0006-emergent-feature-modules.md)). Often empty; that is a
  state, not a gap.
- **`packages/core/src/application/README.md`** — the registry: every port, its
  contract, and who implements it. Read it before proposing a new port, and
  trust it: a fitness function fails the gate when it stops describing the tree.
- **`docs/adr/`** — read the ADRs that touch the area you are about to work in.
  [`README.md`](../adr/README.md) indexes them by subject; an ADR is the answer
  to "why is this constraint here", and it is not yours to re-litigate in
  passing.

## There is no `CONTEXT.md`, on purpose

A separate glossary file would be a third place for terms that already live in
two: the domain types, which the compiler keeps honest, and the ADRs, which
carry the reasoning. A prose glossary drifts from both and no test can catch it
— and this repo's rule is that nothing describing the present goes unchecked.
If a term genuinely has no home, that is a signal the domain is missing a type.

Do not flag the absence of a file, and do not propose creating one upfront.

## Neighbours that are not domain docs

They bound the work all the same:

- **`docs/STATUS.md`** — the present state and the single next action, bounded
  at 60 lines by [`docs/docs.spec.ts`](../docs.spec.ts). A snapshot, never a log.
- **`CLAUDE.md`** — the working method, the hexagonal invariants, the gate.
- **`docs/ARCHITECTURE.md`** — generated from Sheriff's graph by `pnpm arch:map`.
  Read it for shape; never edit it by hand.
