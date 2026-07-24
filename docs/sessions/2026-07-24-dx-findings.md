# Session — 2026-07-24 — dx-findings

## Done

- **Verified and fixed the five DX-review findings** (each reproduced on the
  tree before touching anything):
  - `erasableSyntaxOnly` added to `tsconfig.base.json` (P1): the strip-only
    invariant was held only by the binary test on the reachable graph — an
    enum in a not-yet-wired nursery file passed typecheck. Proved red with an
    enum probe before enabling; tsc now rejects the syntax tree-wide.
  - README bootstrap made honest (P1): Node ≥ 25 no longer bundles Corepack
    while `engines` accepts it, so `corepack enable` was a landmine as the
    third command; the note gives the Node 25 path.
  - README quick start copyable (P2): real degit URL instead of `<your-org>`.
  - tdd-cycle rule reconciled with the shipped example (P2): "one assertion
    per test" → **"one behavior per test"** — main.spec.ts legitimately
    asserts exit code AND message of one run.
  - quality-gate skill refreshed (P2): current Sheriff tag model
    (`layer:*`/`feature:*`, ADR-0006), `public-surface.spec.ts` closes the
    knip gap it still called manual, `main.ts` sets `exitCode` (not
    `process.exit`), and typecheck now carries the strip-only guarantee.
- **README states its audience** ("Who this is for"): drift prevention over
  onboarding speed; durable framework-independent domain logic; UI apps in
  scope as adapters when they carry a domain; wrong tool for prototypes and
  thin CRUD.

## Not done / remaining

- `engines` still allows Node ≥ 25 (deliberate: the bootstrap note covers it;
  bounding to <25 would block a working setup over a one-command install).
- STATUS staleness (test count, phase) still has no fitness function — open
  question in STATUS.

## Decisions

- **One behavior per test**, not one `expect`: several expects on facets of
  the same outcome (one execution) are fine; a second behavior is a second
  test. Skill-level rule, no ADR — the invariant (test-first) is untouched.
- `erasableSyntaxOnly` strengthens the enforcement of
  [ADR-0001](../adr/0001-strip-only-typescript-no-build-step.md) (no
  supersede: same decision, second lock).
- A stale skill is a product defect in a skill-driven template — the agent
  receives a false mental model; skills are living docs and must track the
  tree.
- Module watch: `pnpm modules:hint` — no candidate (nurseries empty).

## Gate status

- typecheck: ✅ (now including the strip-only subset, tree-wide)
- tests (with coverage): ✅ 179 passed, 100 % statements/branches/functions/lines
- mutation (Stryker, local): ✅ 100.00 (62 killed, 0 survived)
- biome / sheriff / knip / jscpd: ✅ all clean

## State to resume from

- **Single next action**: merge the DX-findings PR on green CI; then the first
  real feature / loupe migration (second adapter proving port substitutability).
- Gotchas / half-done edits: none — working tree clean after the report commit.
