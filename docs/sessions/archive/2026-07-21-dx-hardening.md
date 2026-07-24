# Session — 2026-07-21 — dx-hardening

Strict DX-focused review of the whole stack (the example slice treated as
disposable), then one PR fixing everything it surfaced. Every claim below was
verified by experiment, not by reading.

## Done

- **Closed the `cli` → fakes hole.** Sheriff's `cli` tag covers the whole
  package, so production adapter code could import `@app/core/testing`. Now a
  Biome override (specs exempted) — verified by injected violation. ADR-0002,
  the sheriff comment and `/new-feature-hexa` no longer overclaim.
- **Pre-commit no longer destroys partial staging.** `git add` after formatting
  swept unstaged hunks into the commit. Now only fully-staged files are
  formatted; partially staged ones get a loud warning (CI is the backstop).
  Live-tested with a real partially-staged file.
- **Branch-protection command rewritten** with `--input` JSON — `gh api -F`
  cannot express nested keys nor the `null` the endpoint requires.
- **The example is now ejectable in one command.** First-line markers
  (`EXAMPLE … DELETE` / `SKELETON ROLE` / `KEEP`) on all 27 slice files, a
  README "Anatomy" section, and `pnpm eject:example` (marker-driven, so the
  list cannot go stale). Validated in a worktree: gate green in ONE pass after
  eject (vs 4 failures blind), 30 tests survive, the stub binary still locks
  the strip-only invariant. The validation itself caught a misclassified file
  (`report.spec.ts` REWRITE → DELETE).
- **Resolution sites 3 → 2, with proof.** vitest aliases removed (resolves via
  package `exports`). tsconfig `paths` KEPT: without them `check:arch` goes
  green-but-blind (0 violations where the same config reports 5) — Sheriff
  resolves `@app/core` through them. Documented in both files.
- **Doc-only commits now run `docs.spec.ts`** — the fast path no longer bypasses
  the very guard aimed at doc commits.
- **CONTRIBUTING**: WIP-commit policy stated (`--no-verify` tolerated on
  branches, never on main); slash commands identified as Claude Code skills
  with the manual fallback.
- Example pedagogy: `clockContract` NTP tolerance (wall clocks may step back —
  a flaky contract is the worst flake), contract fixtures use a real salutation,
  `describe()` → `describeThrown`, `pnpm greet` root script, README quickstart
  no longer promises "Good morning" at 9 pm, Node ≥ 24 requirement explained.

## Not done / remaining

- CI still billing-blocked (since 2026-07-17) — everything above is local-only,
  Windows matrix still never run.
- `eject:example` is validated on Linux; its file ops are plain Node so Windows
  should hold, but that claim awaits the matrix.
- The stack is now 8 PRs: #10 → … → #16 → #17.

## Decisions

- Fakes ban in adapters enforced by Biome, not Sheriff (tag granularity) —
  amended in [ADR-0002](../adr/0002-port-contracts-in-a-testing-subpath.md).
- tsconfig `paths` are load-bearing for Sheriff — comment in `tsconfig.json`
  is the canonical explanation.
- Partial staging: protect-and-warn beats format-and-clobber; CI backstops.
- `Clock` promises no monotonicity, only absence of wild leaps (wall-clock).

## Gate status

- typecheck / biome / sheriff / knip / jscpd: ✅
- tests (with coverage): ✅ 109 passed, 100 % everywhere
- mutation (Stryker, local): ✅ 100 %, 62 mutants
- post-eject gate (worktree): ✅ green in one pass, 30 tests, 100 %
- CI: ❌ still billing-blocked

## State to resume from

- **Single next action**: open PR #17 (`fix/dx-hardening` → base
  `fix/bounded-project-state`), then merge the stack #10 → #17 in order once
  Actions billing is unblocked.
- Gotchas: Dependabot #9 conflicts with #15 on `ci.yml`; the required status
  check name for branch protection is `Quality gate (ubuntu-latest)`.
