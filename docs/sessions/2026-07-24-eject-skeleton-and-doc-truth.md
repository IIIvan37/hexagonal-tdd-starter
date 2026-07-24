# Session — 2026-07-24 — eject-skeleton-and-doc-truth

## Done

- **Fixed the ejected skeleton's red gate** (review finding P1, reproduced in an
  isolated worktree before touching anything — exactly two tests failed):
  - `public-surface.spec.ts` rejected the index.ts stub's `export {}` while its
    own comment declares an empty surface legitimate. The grammar now absorbs
    the empty-module marker when it is the whole line; a detector self-test
    (written red first) locks the behavior.
  - The tdd-cycle skill named `application/ports.ts`, which only resolved via
    the example's greet slice — deleted by the eject, so the living-docs path
    check went red. Reworded to be true before and after ejection.
  - Re-verified end to end: eject → install → check:fix → **full gate green**
    on the ejected tree.
- **Refreshed `docs/STATUS.md`** (finding P2): it still described the merged
  `chore/doc-truth-and-detector-hardening` branch and 152 tests.
- **Migrated biome.json to the 2.5.5 schema** (finding P3): the 2.5.1 schema
  pin made every check emit a migration diagnostic.
- **ADR-0007**: the starter stays frontend-agnostic — a UI is an adapter the
  consuming project owns (came out of the outside-in frontend discussion).

## Not done / remaining

- STATUS staleness (branch name, test count) has no fitness function — the path
  checker catches broken file mentions only. Logged as an open question in
  STATUS; unresolved whether a mechanical check is even worth it.

## Decisions

- The eject fix belongs in the **detector**, not the stub: the spec already
  declared an empty surface legitimate, so the grammar was contradicting its
  own intent. Only the standalone `export {}` line is absorbed — it exports no
  name the orphan check could miss.
- No frontend package in the starter — [ADR-0007](../adr/0007-frontend-agnostic-starter.md).
- Module watch: `pnpm modules:hint` — no candidate (nurseries empty).

## Gate status

- typecheck: ✅
- tests (with coverage): ✅ 179 passed, 100 % statements/branches/functions/lines
- mutation (Stryker, local, core touched — spec only): ✅ 100.00 (62 killed, 0 survived)
- biome / sheriff / knip / jscpd: ✅ all clean (biome now diagnostic-free)
- ejected-skeleton gate (worktree replay): ✅

## State to resume from

- **Single next action**: merge the `fix/eject-skeleton-and-doc-truth` PR on
  green CI; then step 4 — the first real feature / loupe migration (second
  adapter proving port substitutability).
- Gotchas / half-done edits: none — working tree clean after the report commit.
