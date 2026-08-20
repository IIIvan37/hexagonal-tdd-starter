# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: the method now **harvests its own field reviews**. A module-depth
  review run on the field project produced eight candidates; the three that
  indicted the *method* rather than that project came back as mechanical
  guards — the port registry must describe the tree in both directions, a port
  may not exceed six callable members, and an async port's fake must model its
  delay once the seam is real ([ADR-0008](adr/0008-port-contracts-model-the-hard-dimension.md)).
  The loop that carries findings upstream is now named rather than tacit
  (`/template-harvest`, `Harvest` in CLAUDE.md), and the choice to travel by
  copy instead of a shared plugin is consigned
  ([ADR-0009](adr/0009-method-travels-by-copy-and-harvest.md)).
  Before that: the architecture map, generated from Sheriff's graph and
  drift-checked ([ARCHITECTURE.md](ARCHITECTURE.md), `pnpm arch:map`).
- **Core anatomy**: nurseries (`domain/`, `application/`, currently empty) →
  extracted feature modules (`greet/` is the worked example) + `shared/`
  kernel; public surface, purity, port shape, contracts, variants and the
  registry all fitness-checked.
- **Health**: 234 tests, 100 % coverage, 100 % mutation score; ejected
  skeleton replayed green (map included).

## Next action

Build the `depth-review` workflow — the depth/seam lens as a native workflow
next to `solid-review.js`, with the shape test over `.claude/` shipping in the
same step.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1–5 | Hardening, emergent modules, doc truth, DX findings, architecture map | ✅ merged |
| 6 | Depth-review harvest — registry, port width, fake fidelity, ADR 0008/0009, harvest ritual | ✅ delivered by the depth-review harvest PR |
| 7 | `depth-review` workflow + shape test over `.claude/` | ⬜ |
| 8 | _your first real feature_ — brings the second adapter that proves port substitutability, and wakes the dormant fake-fidelity check | ⬜ |

## Open questions

- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Can STATUS staleness be fitness-checked?** Merge-invariant phrasing (the
  session-report skill demands it) removes the class that flips at merge —
  branch names, PR lifecycle — but a stale test count or phase still needs a
  reader to notice. No mechanical check yet.
