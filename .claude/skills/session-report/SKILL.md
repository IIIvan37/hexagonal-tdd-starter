---
name: session-report
description: Close a work step with a resumable session report. Use at the end of every step/PR so a fresh session can pick up exactly where this one left off. Updates the canonical docs/STATUS.md and appends a dated report under docs/sessions/.
---

# Session report (close a work step)

Produce the artifacts that let a new session resume with zero context loss. Run
this at the end of each step/PR, before stopping.

## 1. Gather the real state (don't guess)

```
date +%F                       # the report's date / filename prefix
git branch --show-current
git status --short
```

Then run the quality gate and record the result:

- `pnpm gate` (typecheck + biome + arch + tests with coverage + knip + jscpd).
- **Mutation testing locally (Stryker).** If the step touched `@app/core` (the
  mutated scope), run `pnpm test:mutation` and report the score in the gate
  section. The CI post-merge run is a backstop, not the gate — surviving mutants
  must be caught **before** the PR, while the code is fresh. Skip only when the
  step touched no mutated package (say so).
- Don't fabricate a green check — report failures honestly.
- **Module watch** (ADR-0006): does a prefix/concept now appear >= 3 times in
  the nursery? does a use-case + port serve a single cluster? `pnpm
  modules:hint` points at candidates. If yes, note it under "Decisions" as a
  pending extraction — or extract before closing (/new-feature-hexa 4bis).

## 2. Append a dated session report

- Copy `docs/sessions/_TEMPLATE.md` to `docs/sessions/<YYYY-MM-DD>-<slug>.md`
  (slug = the step). Never overwrite an existing report — history is append-only.
- Fill every section honestly: Done, Not done / remaining, Decisions, Gate status
  (with the results from step 1), State to resume from.
- "State to resume from" must name the SINGLE next action and any gotchas /
  half-done edits.
- **Decisions is a log, not an explanation.** If the step changed a boundary, an
  invariant or the toolchain, write the reasoning once as an ADR in
  [docs/adr/](../../../docs/adr/) (copy `_TEMPLATE.md`, add it to the index) and
  link it from this section. Never restate the why in both places — a report is
  read to resume, an ADR is read months later by someone about to undo the
  constraint. Most steps need no ADR.

## 3. Roll the window

`docs/sessions/` keeps the **5 most recent** reports. If adding yours makes six,
`git mv` the oldest into `docs/sessions/archive/`. Nothing is deleted — the
working set just stays scannable.

## 4. Rewrite the canonical STATUS

`docs/STATUS.md` is a **snapshot of the present, not a log** — bounded at 60
non-blank lines by `docs/docs.spec.ts`, which fails the gate if it drifts.
Rewrite it, don't append:

- **Where we are** — branch, phase, packages. Replace the old text.
- **Next action** — the SINGLE next thing. Replace it.
- **Current milestone** — the milestone in flight and the next one only. Collapse
  a finished milestone to one line; the detail is in `git log` and the reports.
- **Open questions** — only what is genuinely undecided. **Delete** each one when
  it is resolved: a resolved question is either an [ADR](../../../docs/adr/) or
  nothing.

Never add a session index to STATUS — `ls docs/sessions/` already is one, and
that section is exactly what turned STATUS into a 300-line log on a real project.
If the fitness function fails, the fix is to move content out (history →
sessions, why → ADR), never to raise the bound.

## 5. Keep memory in sync (optional, if the plan shifted)

If a durable cross-session decision changed (an invariant, a resolved open
question, a scope change), capture it. Don't duplicate the whole report — just the
durable decision.

## 6. Commit the report on the feature branch — BEFORE the PR

The report + STATUS update describe the work the PR contains, so they ship
**inside** the PR — never as a separate post-merge commit on `main`.

- Commit them on the **feature branch**, before `gh pr create`. Order per feature:
  feature commits → this report commit → `pnpm gate` → push → open PR → merge.
- Phrase the report for the **pre-merge** state ("PR #N opened", branch still
  current) — not as if it were already merged.
- The doc-only-direct-to-`main` exception (see the `block-commit-on-main` hook) is
  only for a **standalone** report not tied to a code PR; a report that accompanies
  code goes in that code's PR.

## Output

End with a 3-line summary to the user: what's done, the next action, and the
report path.
