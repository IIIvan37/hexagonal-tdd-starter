# Session — 2026-07-22 — emergent-modules

PR9: implementation of [ADR-0006](../adr/0006-emergent-feature-modules.md)
(now **accepted**), plus the public-surface fitness function queued with it.

## Done

- **Restructure**: `shared/` (kernel, `Result` promoted), `greet/` extracted as
  the worked feature module (`{domain,application,testing}`), `domain/` and
  `application/` become the documented NURSERIES (READMEs in place). 114 tests
  green, mutation 100 % (62 mutants) unchanged.
- **Sheriff**: dormant `<feature>` placeholders + two-dimensional rules
  (feature isolation via `sameTag`, layer discipline, nursery ratchet,
  `shared` containment, one-line declared exceptions). **Proven 6/6 by
  injected violations** — the gotcha flagged in the previous report is closed.
- **public-surface.spec.ts**: every VALUE export of `index.ts` needs an
  external consumer. First run caught `buildGreeting` (exported since day one,
  consumed by nobody) — removed. Type exports out of scope (structural typing).
- **`pnpm modules:hint`**: prefix clusters + import cohesion over the nursery,
  hint-only. Verified on empty and seeded nurseries.
- **Eject revalidated in a worktree**: green gate in ONE pass on the new
  anatomy, 35 surviving tests, nurseries + kernel survive, feature folders
  pruned. The validation caught a real bug (empty `it.each` suite fails
  vitest → the ejected empty surface broke the gate) — fixed and re-proven
  both directions.
- Docs/skills synced: `/new-feature-hexa` (birth in the nursery, extraction
  ritual 4bis), `/session-report` (module-watch line), README anatomy,
  CLAUDE.md, ADR-0006 accepted with implementation notes.

## Not done / remaining

- **Loupe migration**: unblocked now — the mechanism it needs exists and is
  proven. Known first moves are in the 2026-07-21 module-discovery report.
- Dependabot #8/#9 still open (#9 conflicts with the rewritten ci.yml — close
  and let it regenerate).
- The CONTRIBUTING "small batches" note and the branch-protection command are
  live but branch protection itself has not been applied to the repo yet.

## Decisions

- ADR-0006 **accepted**; the three open decisions resolved (greet extracted,
  sequenced immediately, `modules:hint` shipped) — recorded in the ADR.
- Sheriff findings recorded in the ADR: ALL of a module's tags must permit an
  edge; unresolvable imports are silently skipped (`check:arch` green is
  meaningless without `typecheck` green beside it); jiti caches the compiled
  config.

## Gate status

- typecheck / biome / sheriff / knip / jscpd: ✅
- tests (with coverage): ✅ 114 passed, 100 % everywhere
- mutation (Stryker, local): ✅ 100 %, 62 mutants
- post-eject gate (worktree): ✅ one pass, 35 tests
- CI: pending on the PR about to open

## State to resume from

- **Single next action**: open the PR for `feat/emergent-modules`, merge on
  green, then apply the branch-protection command from the README.
- Gotchas:
  - `docs/sessions/` holds 4 of 5 reports — the NEXT report rolls
    `2026-07-21-starter-hardening.md` into `archive/`.
  - When adding an adapter package, wire Sheriff tag + Biome testing-ban
    override BOTH (skill says so now).
