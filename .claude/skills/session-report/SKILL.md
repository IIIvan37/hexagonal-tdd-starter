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

## 2. Append a dated session report

- Copy `docs/sessions/_TEMPLATE.md` to `docs/sessions/<YYYY-MM-DD>-<slug>.md`
  (slug = the step). Never overwrite an existing report — history is append-only.
- Fill every section honestly: Done, Not done / remaining, Decisions, Gate status
  (with the results from step 1), State to resume from.
- "State to resume from" must name the SINGLE next action and any gotchas /
  half-done edits.

## 3. Update the canonical STATUS

Edit `docs/STATUS.md`:
- Update the roadmap / progress: what's done, in-progress, next.
- Update "Where we are" (branch, current step, next step).
- Record any open decision that got **resolved** this session.

## 4. Keep memory in sync (optional, if the plan shifted)

If a durable cross-session decision changed (an invariant, a resolved open
question, a scope change), capture it. Don't duplicate the whole report — just the
durable decision.

## 5. Commit the report on the feature branch — BEFORE the PR

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
