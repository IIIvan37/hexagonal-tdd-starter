# Domain nursery

New domain files are **born here, flat** — a nascent concept has no boundary
yet, and naming one up front is speculative design
([ADR-0006](../../../../docs/adr/0006-emergent-feature-modules.md)).

They leave when a module becomes apparent (the rule of three: a third file
sharing a prefix/concept, a use-case + port serving one cluster) — extracted
into `../<feature>/domain/` with one `git mv`; the dormant Sheriff placeholder
rules pick the new folder up with **zero config edits**, and the gate then
enumerates every dependency the module still has here, each one a decision:
join the module, promote to [`../shared/`](../shared), or a declared exception.

Two rules keep this honest:

- **Features may not import the nursery** (the ratchet) — extraction only ever
  increases structure.
- **Nothing is created directly in `shared/`** — things are *promoted* there
  when a second feature needs them.

The `greet` feature next door is what an extracted module looks like.
