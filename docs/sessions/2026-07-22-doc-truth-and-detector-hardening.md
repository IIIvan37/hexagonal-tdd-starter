# Session — 2026-07-22 — doc-truth-and-detector-hardening

## Done
- **Sheriff blind spot closed** (`sheriff.config.ts`): the testing barrel is
  only imported by adapter specs, which Sheriff never walks — every
  `core:testing` rule was verified against nothing (proven by injection: a
  nursery import in the barrel went green). The barrel is now an entry point
  of its own; `core:testing` may reach the nursery, where the method already
  told nursery port fakes to live.
- **Purity detector hardened** (`packages/core/src/purity.spec.ts`): bare
  references (`const f = Date.now`) and computed access (`Math["random"]`)
  now count as impurities; computed access on an ambient global is banned as
  a form.
- **Public-surface detector hardened**
  (`packages/core/src/public-surface.spec.ts`): the barrel is held to the one
  grammar the orphan check can read (`export *`, default exports, inline
  values and imports were public-yet-unchecked); namespace imports pinned as
  deliberately not-a-consumer.
- **Path-truth fitness function** (`docs/docs.spec.ts`): living docs (README,
  CLAUDE.md, CONTRIBUTING, skills, STATUS, registry READMEs) may only name
  paths that exist; session reports and ADR bodies stay exempt. First run
  caught six broken references across four files.
- **Doc drift fixed, redundancy reduced**: post-extraction paths corrected in
  CLAUDE.md, CONTRIBUTING, `new-feature-hexa`, the application registry;
  CONTRIBUTING's non-negotiables now defer to CLAUDE.md instead of
  paraphrasing it.

### Folded in from a second review (same step)

- **`main.ts` sets `process.exitCode`** instead of calling `process.exit()`:
  exit() can tear the process down before stdout/stderr drain to a pipe. The
  reviewer's "gate red, three binary tests fail" did NOT reproduce here (0
  losses in a 100-run stress, gate green all day) — but the race is real,
  Windows CI is more exposed, and the fix is free. Eject keeps `main.ts`, so
  the post-eject skeleton inherits it.
- **The hexagon imports nothing but itself** (`purity.spec.ts`): every
  specifier in a core production file must be relative — the non-enumerative
  closure of Biome's `node:` list, which ages with Node (`node:sqlite`,
  `node:zlib`, bare `fs`, npm strays). One documented seam: `vitest` inside a
  `testing/` folder.
- **Adapter specs cannot justify a public export**
  (`public-surface.spec.ts`): the consumer walk now excludes `*.spec.ts`, so
  "consumed" means a production consumer, as the invariant always claimed.

## Not done / remaining
- The honest-review follow-ups not in this step's scope: an explicit audience
  statement in the README, and a second adapter package to prove port
  substitutability (expected to come with the loupe migration).

## Decisions
- The testing barrel is a Sheriff entry point; `core:testing → nursery` is
  allowed (why: header comment of `sheriff.config.ts`; caveat family:
  [ADR-0006](../adr/0006-emergent-feature-modules.md) implementation notes).
- Prose truth is now mechanical, not disciplinary: living docs are
  fitness-checked for path existence, dated docs exempt (why: comment in
  `docs/docs.spec.ts`).
- Detector evasions (computed access, bare references, non-barrel export
  forms) are rejected as *forms*, so the lexical checks stay total over what
  they can see.

## Gate status
- typecheck: green
- tests (with coverage): green — 175 tests, 100 % coverage (123/123 stmts)
- mutation (Stryker, local): green — 100.00 score (core production code
  untouched this step; incremental run)
- biome / sheriff / knip / jscpd: green (sheriff now verifies two entry
  points: `cli` and `core-testing`)

## State to resume from
- **Single next action**: open the PR for
  `chore/doc-truth-and-detector-hardening`, merge on green CI.
- Gotchas / half-done edits: none. `pnpm modules:hint` — no candidate
  (nurseries are empty). When editing `sheriff.config.ts`, purge
  `node_modules/.cache/jiti` before re-running `check:arch`.
