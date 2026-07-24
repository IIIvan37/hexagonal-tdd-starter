# ADR 0006 — Feature modules are discovered, not decreed (emergent modularity)

- **Status**: accepted (2026-07-22) — mechanism implemented and proven by
  injected violations (6/6: ratchet, isolation, one-line exception, layer
  discipline, nursery→feature descent, shared containment).
- **Date**: 2026-07-21

## Context

Field report from a real project built on this starter: 55 flat files
in `core/src/domain`, 11 in `application`, and "the notion of module is lost".
Measured on its import graph:

- `ports.ts` is a god-file: 306 lines, 24 exported ports spanning every concern.
- A **de-facto kernel nobody declared**: `beat-grid` has in-degree 12; with
  `nearest-time`, `median`, `timecode` it is the domain's shared time language,
  indistinguishable from ordinary siblings.
- An implicit, mostly-consistent concept DAG (`audio ← rhythm ← harmony ←
  structure ← project`) — real architecture, written nowhere, enforced by
  nothing.
- **Two concept-level cycles already born**, each pointing at mislocated
  knowledge: `harmonic-cycle → section-matching` (a generic sequence-agreement
  algorithm trapped inside a concept module) and `seek-step → key-bindings`
  (a transport constant living in a keyboard-shortcuts file).
- The signal had been screaming in the file names for weeks: `chord-*` ×5,
  `loop-*` ×3, `stem-*`, `wav-*` — **the kebab-case prefix is the proto-module**.

Root cause: the method itself. `/new-feature-hexa` said "create
`domain/<name>.ts`" — every concept lands as one more file in a flat layer
folder. Layers are not modules: the hexagon guards the inside/outside dimension
and says nothing about slicing the domain itself.

The obvious fix — feature-first folders from day one — contradicts the
starter's own invariant #2: on day one the bounded contexts are unknown, and
naming them up front is speculative design. Nobody would have guessed
`rhythm/harmony/structure/loops/separation` at that project's day one; they *emerged*.

## Decision

**Modules are discovered, not decreed.** The template ships three things:

### 1. The nursery (day zero, unchanged)

Files are born flat in `domain/` and `application/` — legitimate: a nascent
concept has no boundary yet. `shared/` exists from day one (holding `Result`)
and grows **only by promotion**: something enters `shared/` when a *second*
feature needs it, never by direct creation. (Same logic as the duplication
doctrine: the premature kernel is the wrong abstraction in folder form.)

### 2. The signal, placed inside the existing rituals

Discovery is a human act, but prompted at two precise moments:

- `/new-feature-hexa` step 1 already forces reading the registry before adding
  anything — where a growing `chord-…, chord-…, chord-…` list is *seen*;
- `/session-report` gains one checklist line: *"does a prefix/concept appear
  ≥ 3 times? does a use-case + port serve a single cluster?"* — the rule of
  three, applied to boundaries.

### 3. The pre-wired mechanism (extraction costs one `git mv`)

`sheriff.config.ts` carries **dormant placeholder rules** from day one:

```ts
'packages/core/src/<feature>/domain':      ['domain:<feature>'],
'packages/core/src/<feature>/application': ['application:<feature>'],
```

plus generic depRules: `sameTag` + `shared` by default; a real inter-feature
dependency (the field project's `structure → harmony` — a chart genuinely references
chords) is **one explicit line** in depRules, visible in review.

The extraction procedure — the part that was not understood until spelled out:

1. **Name** the module (the only real decision).
2. **Move the obvious center**: `git mv` the cluster — domain files, *its*
   use-cases, *its* ports (out of the global `ports.ts`), *its* fakes. The
   whole vertical slice, not just the domain. No config edit: the placeholders
   match the new folder and the isolation activates itself.
3. **Let the gate enumerate the frontier.** You do not map the module's
   dependencies by hand; each Sheriff violation is one decision with three
   exits: the file **joins the module**, is **promoted to `shared/`** (second
   consumer), or the edge becomes a **declared exception**. When the gate is
   green the module is both discovered and closed.

   This is the **Mikado method** (Ellnestam & Brolund) with Sheriff drawing
   the prerequisite graph — which imports Mikado's stop rule: **if resolving a
   violation raises further violations more than ~2 levels deep, revert the
   whole move**, extract or promote the prerequisites first as their own
   steps, then retry. An extraction is one Mikado leaf, never a campaign.

4. **Depth check before closing** (Ousterhout, *deep modules*): compare the
   module's export count to its file count. A module whose surface grows as
   fast as its contents is a folder wearing a module's clothes — either the
   boundary is wrong, or the concept was not ready to extract. Small
   interface, large implementation is what the boundary is *for*.

### The ratchet

**Features may not import the nursery** (the reverse is allowed). An extracted
module never depends on unstructured space, so extraction can only increase
structure — and extracting X whose dependency Y is still flat forces the Y
decision (extract or promote) at the same moment.

## Consequences

- Day zero stays as simple as today; the cost appears exactly when a boundary
  is worth its price, and the mechanical part of that cost is near zero.
- The gate's violation list becomes the discovery instrument: mislocated
  knowledge (the field project's two cycles) surfaces the day it costs two minutes, not at
  archaeology time.
- `ports.ts` stops being able to grow into a god-file: each extraction takes
  its ports away.
- A use-case touching several features is surfaced explicitly: either evidence
  the features are one, or a declared composition (the field project's `detect-chords`
  spans harmony+rhythm+structure and would be one).
- The registry README gains a per-module dimension.
- Cost: one more level of nesting once modules exist; the exception list in
  depRules must be curated (an exception per week is a sign the boundary is
  wrong).

## Alternatives considered

- **Feature-first from day one.** Screams the domain, `rm -r` deletes a
  feature — but forces naming bounded contexts before writing code:
  speculative design, the exact thing invariant #2 forbids. Rejected as the
  *default*; it remains the end state extraction converges to.
- **Status quo + documentation.** The field project is the proof that what the example
  does not model does not happen. Rejected.
- **A clustering tool that proposes modules automatically.** The analysis that
  produced the field evidence is scriptable (`modules:hint`, prefix clusters +
  import cohesion), but naming a boundary is a domain act — at most a hint,
  never a verdict. Left as an open decision below.

## Decisions resolved at implementation (2026-07-22)

1. **`greet` ships extracted** (`core/src/greet/{domain,application,testing}`):
   the user sees both ends of the lifecycle — the empty nurseries where their
   own files will be born, and next door what an extracted feature looks like.
2. **Sequenced immediately after the stack merged** — implemented from a clean
   `main`.
3. **`modules:hint` shipped**, hint-only (prefix clusters + import cohesion
   over the nursery); naming a boundary remains a human act.

Implementation notes that matter later:
- Sheriff placeholder syntax works and ALL of a module's tags must permit an
  edge (proven by injection — e.g. a layer violation fires even when the
  feature tag allows `sameTag`).
- Sheriff **silently skips unresolvable imports**: a broken graph verifies
  green. Harmless inside the gate — typecheck fails first — but never trust
  `check:arch` alone on a tree whose imports may be stale.
- Sheriff compiles its config through jiti with a filesystem cache
  (`node_modules/.cache/jiti`); when scripting rapid config edits, purge it.
