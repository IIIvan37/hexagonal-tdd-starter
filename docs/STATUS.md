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
- **Health**: 245 tests, 100 % coverage, 100 % mutation score; ejected
  skeleton replayed green (map included).

## Next action

Work the queue in [reviews/2026-08-20-depth-review.md](reviews/2026-08-20-depth-review.md),
starting with the **fake-fidelity recognizer** — before the first real feature. It counts
adapters by the `implements` keyword, so a const-typed or factory adapter leaves
the ADR-0008 guard asleep and the gate green — and the field-project fakes that
motivated the ADR are written in exactly that style. It is a prerequisite: the
first feature is what is meant to wake this check.

Then build **your first real feature** as a hexagonal vertical slice
(`/new-feature-hexa`) — the second adapter that proves port substitutability.

## Current milestone

| Step | Description | Status |
|------|-------------|--------|
| 1–5 | Hardening, emergent modules, doc truth, DX findings, architecture map | ✅ merged |
| 6 | Depth-review harvest — registry, port width, fake fidelity, ADR 0008/0009 | ✅ delivered by PR #39 |
| 7 | `depth-review` workflow + the shape test over `.claude/` | ✅ delivered by the depth-review workflow PR |
| 8 | First real `/depth-review` run — 14 raw, 9 refuted, 5 confirmed; workflow recalibrated on its own yield | 🔵 in progress |
| 9 | Fake-fidelity recognizer + eject taxonomy check — the two harvest candidates | ⬜ |
| 10 | _your first real feature_ — brings the second adapter that proves port substitutability | ⬜ |

## Open questions

- **Is a build step wanted eventually?** Deferred in
  [ADR-0001](adr/0001-strip-only-typescript-no-build-step.md) — revisit if this
  ever ships to npm.
- **Can STATUS staleness be fitness-checked?** Merge-invariant phrasing (the
  session-report skill demands it) removes the class that flips at merge —
  branch names, PR lifecycle — but a stale test count or phase still needs a
  reader to notice. No mechanical check yet.
- **Do the gate's own boundaries deserve the same rules as the hexagon's?** The
  depth review's five survivors are all in gate machinery and build scripts,
  and four share one shape: knowledge with no module (what an adapter is, which
  files are skeleton, what the source tree is), re-derived everywhere, with
  jscpd configured not to see it. Either that layer is held to the doctrine or
  the exemption is written down.
