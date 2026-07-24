# Architecture decisions

Why the constraints in this repo exist — so the next reader does not "simplify"
one that was load-bearing.

## When to write one (and when not to)

An ADR and a session report are **not** the same artefact, and the boundary is
worth keeping sharp:

| | [`docs/sessions/`](../sessions/) | here |
|---|---|---|
| Indexed by | date | subject |
| Read when you want to | **resume** the work | **change** a constraint, months later |
| Contains | what was done, where we are, the next action | why, the alternatives rejected, the costs accepted |
| Lifetime | stale by the next session | alive as long as the constraint is |

**Write an ADR** when a change touches a boundary, an invariant or the toolchain
— the things someone will later be tempted to undo without knowing why they
exist. That is rare; most steps need none.

**Do not** restate the reasoning in the session report. Its `Decisions` section
links here instead: one canonical explanation, one place to update.

Copy [`_TEMPLATE.md`](_TEMPLATE.md). Number sequentially; never rewrite an
accepted ADR — supersede it with a new one and update the old one's status.

## Index

| # | Decision | Status |
|---|----------|--------|
| [0001](0001-strip-only-typescript-no-build-step.md) | Ship TypeScript sources, run them under Node's type stripping | accepted |
| [0002](0002-port-contracts-in-a-testing-subpath.md) | Port obligations live in contracts, shipped from `@app/core/testing` | accepted |
| [0003](0003-ambient-state-behind-ports.md) | Ambient state goes behind a port, and three layers enforce it | accepted |
| [0004](0004-errors-as-tagged-values.md) | Expected failures are tagged values; bugs are left to crash | accepted |
| [0005](0005-bounded-project-state.md) | Project-state docs are bounded, and the bound is mechanical | accepted |
| [0006](0006-emergent-feature-modules.md) | Feature modules are discovered, not decreed (emergent modularity) | accepted |
| [0007](0007-frontend-agnostic-starter.md) | Keep the starter frontend-agnostic; a UI is an adapter the consuming project owns | accepted |
