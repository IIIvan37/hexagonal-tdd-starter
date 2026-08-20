# ADR 0009 — The method travels by copy and harvest, not by plugin reference

- **Status**: accepted
- **Date**: 2026-08-20

## Context

This starter ships more than a skeleton: `.claude/skills/` and
`.claude/workflows/` encode the method, and they are copied when a project is
scaffolded from the template. Copying is the form that duplicates.

Claude Code offers the form that does not. A plugin published through a
marketplace is enabled declaratively per project (`extraKnownMarketplaces` +
`enabledPlugins`); there is one canonical copy, `/plugin update` propagates
improvements, and no consumer can drift. On the face of it, that is strictly
better for a repo whose entire thesis is drift prevention — and the question
will be asked again by anyone who meets this tree, so the reasoning belongs
here rather than in a conversation.

**The measured drift.** Between this template and its one field consumer, after
roughly two months: `quality-gate` 87 divergent lines, `session-report` 98,
`new-feature-hexa` 90, `tdd-cycle` 20, the SOLID review workflow 58. That reads
like a failure of the copy model until one reads *what* diverged: the field
project's quality gate knows Rust crates, Sonar and i18n extraction, none of
which exist here. The divergence is adaptation, not decay. A shared plugin
cannot express it — the consumer would have to fork the plugin or bend its build
to the template's shape.

**The propagation already exists, in a weaker but working form.** Three of the
fitness functions in this repo — `contract-discipline`, `variant-discipline`,
`adr-pointers` — were harvested *from* the field project's reviews and landed
here as PRs; ADRs travelled the other way and were adapted on arrival. Both
directions are recorded in session reports. The loop the plugin would enforce is
already turning, by hand.

**A plugin reference cannot be pinned.** `enabledPlugins` maps a plugin to
`true`; there is no version field. A template that promises mechanical
reproducibility would be writing an unpinnable dependency into every downstream
project's settings.

## Decision

The method ships as **files in the consuming project's tree**, copied at scaffold
time. The project owns its copy and is expected to adapt it.

Propagation is a **named ritual, not a coupling**: `/template-harvest` carries a
field finding upstream into a PR here; the documented sync carries a template
change downstream, adapted by hand. CLAUDE.md states what the template expects of
its consumers, so the loop does not depend on the same person standing at both
ends.

The template declares **no external plugin** in `.claude/settings.json`.
Third-party skill plugins stay user-scoped, where they cannot make a promise the
template would have to keep.

## Consequences

- A scaffolded project is **self-contained**. No marketplace to add, no plugin to
  install, nothing that can move under it between two `pnpm gate` runs. The eject
  stays a true green skeleton.
- A consumer keeps **the right to a method that fits its tree** — a gate that
  knows Rust, a report template in its own language.
- The cost is real and permanent: **divergence is unmeasured, and an improvement
  made downstream reaches the template only if a human harvests it.** Two of the
  three inherited fitness functions arrived that way, so the loop works — but it
  is a human loop, and a consumer who never harvests keeps the method it started
  with, forever.
- The template has to **earn re-adoption on merit** every time, instead of
  arriving by `/plugin update`.

## Alternatives considered

- **Plugin hosted in this repo** (self-referencing marketplace, eject rewriting
  `settings.json` to reference upstream). The most tempting: one canonical copy,
  and the skills would ship next to the fitness functions that prove them.
  Rejected because it buys that at the price of the right to diverge — which the
  measured drift shows is what consumers actually need — and because the
  reference could not be pinned.
- **Plugin in a separate repo.** Rejected for a second reason on top: it
  separates the skills that *teach* the method from the fitness functions that
  *prove* it. `contract-discipline.spec.ts` and `/new-feature-hexa` state one
  rule to two audiences; splitting them across repos manufactures exactly the
  drift this repo exists to prevent.
- **Declaring third-party skill plugins at project scope.** Rejected: no version
  field, so the template would be promising behaviour it does not control.
- **A drift report comparing `.claude/` against upstream.** Rejected: on the
  field project it would list some 350 differences, nearly all deliberate. A
  report that is 95 % noise is read once.
