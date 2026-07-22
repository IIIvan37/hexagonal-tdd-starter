# ADR 0005 — Project-state docs are bounded, and the bound is mechanical

- **Status**: accepted
- **Date**: 2026-07-21

## Context

Reported from a real project built on this starter: **`docs/STATUS.md` grew very
large, and `docs/sessions/` accumulated files.**

The cause was structural, not sloppiness. `STATUS.md` mixed two natures of
information, and three of its sections could only grow:

| Section | Nature | Growth |
|---|---|---|
| Where we are | present | bounded (rewritten) |
| Next step | present | bounded |
| Roadmap | history | **one row per step, forever** |
| Session journal | index | **one line per session** — duplicating `ls docs/sessions/` |
| "record any resolved decision" (`/session-report`) | decisions | **accumulates** |

A 300-line STATUS defeats its own purpose: nobody reads the three lines that
matter. And `/session-report` runs at the end of *every* step, so the drift is
continuous and invisible — each addition is individually reasonable.

## Decision

**`STATUS.md` describes the present. Anything that only accumulates is derivable
elsewhere and is removed from it.**

- The session journal section is gone — `ls docs/sessions/` is the index.
- The roadmap keeps the milestone in flight and the next one; finished milestones
  collapse to a line. `git log` and the reports hold the detail.
- Resolved decisions leave STATUS entirely: they become an [ADR](README.md), which
  is indexed by subject and therefore bounded by the number of topics rather than
  the number of commits. "Open questions" lists only what is still open, and each
  entry is deleted on resolution.
- `docs/sessions/` is a **rolling window** of the 5 most recent reports; older
  ones are `git mv`'d to `docs/sessions/archive/`. Moved, never deleted.

The bounds are enforced by a fitness function, `docs/docs.spec.ts`, in the gate:
STATUS ≤ 60 non-blank lines, ≤ 5 active reports, no session links in STATUS.

## Consequences

- The gate fails on a doc, which is unusual and will feel like friction. That is
  the intent — good intentions are exactly what already failed here.
- The failure message says what to move where, so the fix is mechanical.
- The numbers (60, 5) are arbitrary and chosen to be *slightly uncomfortable*.
  Raising them is the wrong reflex: if STATUS does not fit, content belongs in
  sessions or an ADR.
- Archiving is manual, one `git mv` per rollover, prompted by a failing test.
- `docs/` is now in `tsconfig.json` and the vitest `include`, for one spec file.

## Alternatives considered

- **Document the rule, no check.** What the method already did implicitly. It is
  the approach whose failure prompted this ADR.
- **One report per milestone instead of per step.** Fewer files, but reports get
  long and the "state to resume from" — the part that is actually read — gets
  buried under history.
- **Drop session reports; rely on `git log` and PR descriptions.** Lightest, and
  tempting: older reports are rarely read. Rejected because the *current* report
  carries in-progress state (half-done edits, gotchas) that no commit records —
  which is the whole point of resumability. The rolling window keeps that value
  while capping the cost.
- **Auto-archive in a hook.** Silent file moves in a commit are surprising; a
  failing test that names the fix is louder and easier to trust.
