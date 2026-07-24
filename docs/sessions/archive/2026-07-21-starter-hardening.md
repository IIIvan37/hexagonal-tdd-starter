# Session — 2026-07-21 — starter hardening

Review of the whole starter, then a stacked series of 7 PRs fixing what it found.

## Done

- **[#10] Runtime entrypoint.** The `greet` bin was installable but unrunnable: a
  parameter property broke Node's strip-only stripping. Fixed, plus the vitest
  `@app/core` alias (`URL.pathname` → `fileURLToPath`, broken on Windows). Locked
  by a spec that runs the real binary.
- **[#11] Port contracts + acceptance test.** `packages/cli` was at 0 % coverage.
  Added `@app/core/testing` (contracts + in-memory fakes), extracted `run.ts`
  from `main.ts` so the slice is testable in process. 43 % → 98 %.
- **[#12] Clock port + determinism.** The purity denylist let `Date.now()` and
  `Math.random()` through. Example slice made time-aware so the port has a real
  consumer; denylist extended; fitness function added for what Biome cannot
  express.
- **[#13] Typed errors.** Blanket `try/catch` disguised bugs as business rules.
  `Result<T, E>` with error tags, presentation moved to `cli/src/report.ts`,
  `HourOfDay` branded so `salutationFor` is total.
- **[#14] Config coherence.** jscpd 2 → 0, coverage 90/85 → 100 everywhere, dead
  `globals: true` removed, `.vscode/settings.json` added.
- **[#15] Community + CI.** LICENSE, CONTRIBUTING, PR template, `docs/adr/`,
  Windows in the CI matrix, Stryker incremental cache (it was inert), mutation
  report artifact, `pnpm audit` job, branch-protection instructions.
- **[#16] Bounded project state.** From your field report — see Decisions.

Every guard added was verified by injecting a violation, not just written.

## Not done / remaining

- **CI has validated none of this.** GitHub Actions is blocked on billing since
  2026-07-17 (`The job was not started because recent account payments have
  failed…`) — it predates this work and hits `main` and Dependabot branches too.
  Everything below is **local only**.
- Consequently the **Windows matrix added in #15 has never run**. The path bug it
  would have caught was real; that the suite passes on Windows is unverified.
- Branch protection (#15) depends on required status checks that cannot run yet.
- Dependabot **#8** and **#9** are open and will conflict with the stack: #9
  touches `ci.yml`, which #15 rewrites. Merge them after the stack.
- The 7 PRs are stacked; each base retargets as the one below merges.

## Decisions

- Ship `.ts` sources under type stripping, no build step — [ADR-0001](../adr/0001-strip-only-typescript-no-build-step.md)
- Port obligations as contracts in `@app/core/testing` — [ADR-0002](../adr/0002-port-contracts-in-a-testing-subpath.md)
- Ambient state behind ports, enforced in three layers — [ADR-0003](../adr/0003-ambient-state-behind-ports.md)
- Expected failures are tagged values; bugs crash — [ADR-0004](../adr/0004-errors-as-tagged-values.md)
- Project-state docs bounded mechanically — [ADR-0005](../adr/0005-bounded-project-state.md)
- `HourOfDay` branded with a `unique symbol` rather than a string literal
  (collision impossible, forgery needs an explicit `as`) — recorded in ADR-0004.

## Gate status

- typecheck: ✅
- tests (with coverage): ✅ 109 passed, **100 %** statements / branches /
  functions / lines
- mutation (Stryker, local): ✅ **100 %**, 62 mutants killed, 0 survived
- biome / sheriff / knip / jscpd: ✅ (jscpd now threshold 0, 0 clones)
- CI: ❌ **not run** — account billing, see above

## State to resume from

- **Single next action**: merge the stack in order
  #10 → #11 → #12 → #13 → #14 → #15 → #16, then Dependabot #9 (`ci.yml` conflict
  expected) and #8.
- Gotchas:
  - Unblock GitHub Actions billing first, otherwise nothing is verified remotely
    and branch protection cannot be enabled.
  - After merging, run the `gh api` branch-protection command in the README; the
    required check is now `Quality gate (ubuntu-latest)` (renamed by the matrix).
  - `docs/sessions/` holds 1 report of 5; `docs/docs.spec.ts` fails the gate at 6.
