---
name: template-harvest
description: Carry a field-project finding back upstream into this template as a PR. Use when a project built from the starter surfaces something true of the METHOD, not just of that project — a class of bug a review keeps finding, a rule the gate should have caught, a port shape that went wrong. Produces the fitness function or ADR, never a copied fix.
---

# Template harvest (field → template)

The method travels by copy ([ADR-0009](../../../docs/adr/0009-method-travels-by-copy-and-harvest.md)),
so nothing reaches the template on its own. This is the ritual that carries it.
`contract-discipline.spec.ts`, `variant-discipline.spec.ts` and
`adr-pointers.spec.ts` all arrived this way.

## 1. Separate the finding from the project

The single question that decides whether there is anything to harvest:

> Would this have happened to **any** project built from this template, or only
> to one that made this project's choices?

- *Any project* → harvest. A degenerate fake, a registry that drifted, a port
  that grew into a dependency sack: the method allowed it.
- *This project only* → do not harvest. A gate that needs to know about Rust, a
  report template in another language, a domain rule: these are why consuming
  projects own their copy.

Write the answer down before going further. A harvest that cannot answer this
question ships the field project's shape into every future project.

## 2. Find the root, not the instance

The template never takes the fix; it takes the **rule that would have prevented
the fix from being needed**. Ask what mechanically distinguishes the broken
shape from the sound one — that is the detector. If nothing does, the harvest is
an ADR, not a spec, and that is a legitimate outcome.

## 3. Choose the form

| The finding is | Ship |
|---|---|
| a shape a detector can see | a fitness function in `packages/core/src/*-discipline.spec.ts` |
| a decision someone will later undo | an ADR under `docs/adr/` |
| a step the method forgot to ask for | a line in the relevant skill |

Usually a spec **and** an ADR: the spec fails, the ADR says why the failure is
right.

## 4. Write it so it cannot rot

- **Test the detector itself.** Every fitness function here has a
  `describe('the detector itself')` block. A detector that only ever passes is
  not evidence — prove it goes red, and say so in the PR.
- **Prove the red on the real tree.** Perturb the tree (add the offending
  shape), watch it fail, restore. Report both directions when the rule has two.
- **Name the origin in the docstring.** "Distilled from a field project's
  review" tells the next reader this rule was paid for, not invented.
- **Do not ratchet a bound to today's value** when today's value is an artifact
  of the example slice — pick a threshold that is dormant here and meaningful in
  the field, and say which.

## 5. Close it

A harvest is a step: branch, PR, `/session-report`. In the field project, record
in its own session report that the finding went upstream, so the two histories
can be read against each other later.
