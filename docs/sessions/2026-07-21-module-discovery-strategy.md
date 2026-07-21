# Session — 2026-07-21 — module-discovery-strategy

Design session, no code: how the template should handle module boundaries, so
that a project does not end up as 55 flat files with "the notion of module
lost". Everything durable is in [ADR-0006](../adr/0006-emergent-feature-modules.md)
(status: proposed); this report carries the evidence and the resume state.

## Done

- **Analyzed loupe** (`~/perso/loupe`), a real project built on this starter,
  as the field case. Method: import graph over `core/src/domain` (48 files, 52
  internal edges) + `application` (11 use-cases), hypothesis clusters by file
  prefix, cross-cluster edge count, then read the suspicious edges in the code.
- Findings (detail in the ADR context): a de-facto kernel nobody declared
  (`beat-grid` in-degree 12), a real but implicit concept DAG, **two born
  cycles** (`harmonic-cycle → section-matching`, `seek-step → key-bindings`,
  both verified in source — each is mislocated knowledge), `ports.ts` as a
  306-line / 24-export god-file, and use-cases that otherwise map 1:1 to
  clusters (`detect-tempo` → rhythm…; `detect-chords` spans 3 → a composition
  use-case; `error-message` → shared).
- Nuance that matters: 52 edges / 55 files is a SPARSE graph. Loupe is not a
  ball of mud — it is an illegible-but-decoupled domain with two nascent
  cycles. Migration is an afternoon now, a project later.
- **Strategy designed and recorded** (ADR-0006): emergent modules — nursery,
  signal-in-the-ritual (rule of three on prefixes), pre-wired dormant Sheriff
  placeholders, gate-enumerated extraction, features-cannot-import-nursery
  ratchet, shared-by-promotion.
- Prior discussion, same session: jscpd threshold 0 kept but the "a clone =
  factor it" doctrine to be softened (three exits: factor / mark deliberate /
  when unsure, duplicate). Not yet implemented — fold into PR9 or a doc PR.

## Not done / remaining

- **PR9 (implementation) not started** — three decisions block it, listed at
  the end of ADR-0006: greet extracted vs nursery; sequencing (stacked now /
  after merge / loupe map first); ship `modules:hint` or not.
- Loupe itself untouched, on purpose ("before touching loupe, settle the
  template strategy"). Its candidate fixes are known: promote
  `sequenceAgreement` + `beat-grid` & friends to a kernel, move
  `SEEK_STEP_SECONDS` out of `key-bindings`, decide whether `key-bindings`
  (KeyboardEvent codes, AZERTY) belongs in a pure domain at all.
- CI still billing-blocked; stack #10 → #17 unmerged, all verification local.

## Decisions

- Emergent modularity over feature-first-from-day-one — [ADR-0006](../adr/0006-emergent-feature-modules.md)
  (proposed; the why, the mechanism, and the loupe evidence live there, not here).

## Gate status

- Doc-only step: `docs/docs.spec.ts` green (bounds hold). Code gate unchanged
  since the previous report (109 tests, 100 % coverage, mutation 100 %).

## State to resume from

- **Single next action**: answer ADR-0006's three open decisions, then
  implement PR9 accordingly (placeholders + ratchet + skill updates + eject
  revalidation, same discipline as #17: injected violation, worktree check).
- Gotchas:
  - The loupe analysis is reproducible: import-graph + prefix-cluster script
    over `packages/core/src/{domain,application}` — 10 lines of python; the
    numbers above are from 2026-07-21.
  - Sheriff placeholder syntax (`src/<feature>/domain`) is assumed from its
    docs but NOT yet proven in this repo — prove it first in PR9, the same way
    tsconfig-paths-for-Sheriff was proven (violation injected both ways).
  - Stack order #10 → #17, then Dependabot #9 (ci.yml conflict) and #8.
