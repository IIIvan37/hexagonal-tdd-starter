# STATUS

> **A snapshot of the present, not a log.** Rewritten at the end of each step by
> `/session-report`, and bounded at 60 non-blank lines by `docs/docs.spec.ts`.
> History → [sessions/](sessions/) · why → [adr/](adr/) · what changed → `git log`.

## Where we are

- **Phase**: the method is now **mechanically checked and replayable**. Its two
  structural reviews live as workflows in `.claude/workflows/` — `/solid-review`
  (does the code respect known principles) and `/depth-review` (are the
  boundaries in the right places at all: seam placement, module depth,
  information leakage, decomposition axis). Both fan out, then adversarially
  verify every finding before reporting it.
  The assets that ARE the method are themselves gated
  (`docs/claude-assets.spec.ts`): a skill is named after its directory and opens
  with real frontmatter, a workflow parses as the async body the runtime runs
  and declares every phase it uses, and neither may name a `pnpm` script or a
  path that does not exist. That gate exists because these files travel by copy
  ([ADR-0009](adr/0009-method-travels-by-copy-and-harvest.md)) — a broken asset
  is copied into a project whose author has no reason to doubt it.
  Before that: the depth-review harvest — the ports registry, the port-width
  ceiling and the dormant fake-fidelity detector
  ([ADR-0008](adr/0008-port-contracts-model-the-hard-dimension.md)).
- **Core anatomy**: nurseries (`domain/`, `application/`, currently empty) →
  extracted feature modules (`greet/` is the worked example) + `shared/`
  kernel; public surface, purity, port shape, contracts, variants and the
  registry all fitness-checked.
- **Health**: 243 tests, 100 % coverage, 100 % mutation score; ejected
  skeleton replayed green (map included).

## Next action

Build **your first real feature** as a hexagonal vertical slice
(`/new-feature-hexa`). It is what brings the second adapter that proves port
substitutability, and what wakes the dormant fake-fidelity check.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1–5 | Hardening, emergent modules, doc truth, DX findings, architecture map | ✅ merged |
| 6 | Depth-review harvest — registry, port width, fake fidelity, ADR 0008/0009 | ✅ delivered by PR #39 |
| 7 | `depth-review` workflow + the shape test over `.claude/` | ✅ delivered by the depth-review workflow PR |
| 8 | _your first real feature_ — brings the second adapter that proves port substitutability, and wakes the dormant fake-fidelity check | ⬜ |

## Open questions

- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Can STATUS staleness be fitness-checked?** Merge-invariant phrasing (the
  session-report skill demands it) removes the class that flips at merge —
  branch names, PR lifecycle — but a stale test count or phase still needs a
  reader to notice. No mechanical check yet.
- **What does `/depth-review` actually yield?** Its calibration is reasoned, not
  measured — it has never been run. `/solid-review` carries a real yield in its
  `whenToUse` (20 raw, 14 refuted, 6 confirmed); record the first real one the
  same way, and tighten the lenses that produce only refuted claims.
