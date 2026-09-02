---
name: session-report
description: Close a work step with a resumable session report, so a fresh session picks up exactly where this one left off. Records the state, verifies nothing (the gate and mutation testing are /quality-gate's job). Appends a dated report under docs/sessions/ and rewrites the canonical docs/STATUS.md.
---

# Session report (hand the work over to the next session)

One responsibility: **continuity**. A fresh session must resume from the report
and STATUS alone, without re-exploring the code. This skill records facts; it
produces none. Checks (gate, mutation testing, module watch) belong to
`/quality-gate` and `/new-feature-hexa` and have run **before** this skill is
invoked — or the report says, honestly, that they have not.

## 1. Gather the real state (don't guess)

```
date +%F                       # the report's date / filename prefix
git branch --show-current
git status --short             # uncommitted work = half-done edits
git log --oneline main..HEAD   # what the step committed
```

The one quality fact a resume needs is whether the tree was green when the
session stopped: the last `pnpm gate` result observed this session (green,
red, or not run). Write it down as observed — never run the gate from here
to turn it green. That is a `/quality-gate` step, and it comes first.

## 2. Append a dated session report

- Copy `docs/sessions/_TEMPLATE.md` to `docs/sessions/<YYYY-MM-DD>-<slug>.md`
  (slug = the step). Never overwrite an existing report — history is append-only.
- Fill every section honestly: Done, Not done / remaining, Decisions, State to
  resume from.
- "State to resume from" must name the SINGLE next action, the tree state
  (gate result, what is uncommitted) and any gotchas / half-done edits.
- **Decisions is a log, not an explanation.** If the step changed a boundary, an
  invariant or the toolchain, write the reasoning once as an ADR in
  [docs/adr/](../../../docs/adr/) (copy `_TEMPLATE.md`, add it to the index) and
  link it from this section. Never restate the why in both places — a report is
  read to resume, an ADR is read months later by someone about to undo the
  constraint. Most steps need no ADR.

## 3. Roll the window

`docs/sessions/` keeps the **5 most recent** reports (bounded by
`docs/docs.spec.ts`, which fails the gate past that). If adding yours makes six,
`git mv` the oldest into `docs/sessions/archive/`. Nothing is deleted — the
working set just stays scannable.

## 4. Rewrite the canonical STATUS — inside the PR, merge-invariantly

`docs/STATUS.md` is a **snapshot of the present, not a log** — bounded at 60
non-blank lines by `docs/docs.spec.ts`, which fails the gate if it drifts.
Rewrite it, don't append:

- **Where we are** — phase, step, packages. Replace the old text.
- **Next action** — the SINGLE next thing, one line. Replace it. A list of
  candidates is not a next action: the following session would pick, and
  pick differently from what this one had in mind.
- **Write it merge-invariantly.** STATUS ships inside the PR but is read on
  `main` after the merge — any fact that flips at merge time is born stale.
  Name the step and its PR ("step N, delivered by PR #NN" is true before and
  after), never the feature branch or the PR's lifecycle state ("PR opening",
  "merge on green CI"); make the next action the one that follows the merge.
  Only the dated report keeps pre-merge phrasing (it describes a past).
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
  feature commits → `/quality-gate` → this report commit → push → open PR →
  merge. The report commit is doc-only: the pre-commit hook skips the code gate
  and runs only the docs fitness function.
- Phrase the **dated report** for the **pre-merge** state ("PR #N opened",
  branch still current) — not as if it were already merged. STATUS is the
  opposite (see step 4): merge-invariant, because it lives on `main`.
- The doc-only-direct-to-`main` exception (see the `block-commit-on-main` hook) is
  only for a **standalone** report not tied to a code PR; a report that accompanies
  code goes in that code's PR. A CI verdict that lands after the push is a PR
  check, never a post-merge report edit.

## Resuming from a report (the other half of the contract)

On a fresh session, do exactly two reads — `docs/STATUS.md` and the newest
report:

```
ls docs/sessions/*.md | sort | tail -1     # names are date-prefixed
```

Never `ls -t`: a checkout resets mtimes and returns the wrong report. Then
jump straight to the files the report names; explore beyond them only when
the report is silent on something needed. If the branch is not `main` and
carries uncommitted work no report names, the previous cycle was interrupted
— say so before doing anything else.

## Output

End with a 3-line summary to the user: what's done, the next action, and the
report path.
