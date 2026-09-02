# Session — 2026-08-20 — depth-review workflow

## Done

- **`.claude/workflows/depth-review.js`** — the module-depth review that
  produced step 6's harvest, frozen as a replayable workflow. Four independent
  lenses (seam placement, module depth, information leakage, decomposition
  axis), then one adversarial verifier per finding, then a synthesis phase that
  writes the report. Modelled on `solid-review.js`; differs in two ways worth
  knowing:
  - **Corroboration is per FILE and is a weak prior, not proof.** Two lenses
    landing on the same file are two independent reasons to look, but explorers
    converge on big files for boring reasons — so the count is passed to the
    verifier as a prior it is told to discount, and the claims are verified
    separately rather than merged. Agreement on a file cannot launder
    disagreement about what is wrong with it.
  - **The calibration section is most of the value.** It names what does not
    count: anything a fitness function already fails the build for, speculative
    depth (this codebase is outside-in), the worked example's deliberate
    degeneracy, empty nurseries. The report closes on "not retained" and on
    which survivors indict the *method* — the input `/template-harvest` expects.
- **`docs/claude-assets.spec.ts`** — nine mechanical rules over `.claude/`, the
  shape test this step owed. Every one proved red before it was kept (one
  deliberate breakage per rule, restored). Skills: a SKILL.md exists, opens with
  name+description frontmatter, and is named after its directory. Workflows:
  the body parses as the async function the runtime actually runs, exports a
  `meta` literal, is named after its file, and declares every phase it uses.
  Across both: a quoted `pnpm` command resolves to a real script; a workflow's
  prose names only paths that exist.
- **`tdd-cycle` taught the forbidden test invocation** — line 37 said
  `pnpm test -- <path-or-name>`; CLAUDE.md says the `--` defeats the filter and
  runs the whole suite. Found while surveying what the shape test could check.
  Fixed, and left as a review finding: "is this the command form the project
  documents as correct" is not a shape.
- **CLAUDE.md names both review workflows** under Working method. Neither was
  mentioned where the method is described.

## Not done / remaining

- Nothing half-edited; the tree is clean.
- Step 8 (a real feature) is what wakes the dormant fake-fidelity detector — it
  needs a second real adapter for an async port. Unchanged by this step.

## Decisions

- **The `.claude/` shape test lives in `docs/`, not beside what it guards.**
  `.claude/**` is excluded from Biome and Knip on purpose, so a spec there would
  be the one TypeScript file in the tree that Biome never formats and `tsc`
  never sees. The vitest include already covers spec files under `docs/`.
- **Path truth for workflows is a separate check from `docs.spec.ts`, not a
  duplicate.** That detector reads backticked spans and markdown links; a
  workflow's prose lives in a template literal where a backtick would end the
  string. Adding workflows to its `livingDocs()` was tried first and **passed
  vacuously** — it was reverted rather than kept as false coverage. The
  replacement anchors on a known top-level root, which is what lets it skip
  `try/catch` without the prose-or-path heuristics.
- **`node --check` cannot validate a workflow.** It rejects the top-level
  `return` every script ends on — `solid-review.js` fails it too. The spec
  compiles the body as an `AsyncFunction` with the runtime hooks as parameters
  instead, and never calls it.
- No ADR: this step added no boundary or invariant, it made an existing one
  (ADR-0009 — the method travels by copy, so a broken asset is copied too)
  mechanically checkable.
- Module watch (ADR-0006): `pnpm modules:hint` finds no candidate; the nurseries
  are empty. Nothing to extract.

## Gate status

- typecheck: pass
- tests (with coverage): 243 passed / 23 files (+9 from the shape test) —
  statements 100 %, branches 100 %, functions 100 %, lines 100 %
- mutation (Stryker, local): **not run — no core source touched.**
  `pnpm test:mutation:diff` says so itself and exits clean. The full run stays
  CI's post-merge job.
- biome / sheriff / knip / jscpd: pass — Sheriff clean on `cli` and
  `core-testing`, 0 clones.

## State to resume from

- **Single next action**: open the PR for this branch
  (`feat/depth-review-workflow`, 4 commits), then start step 8 — the first real
  feature.
- Gotchas / half-done edits:
  - The shape test is the only thing that reads `.claude/`. If you add a
    workflow, it must parse as an async body and declare its phases in `meta`;
    if you add a skill, the directory name is its identity.
  - `depth-review` has never been *run*. Its calibration is reasoned, not
    measured — unlike `/solid-review`, whose `whenToUse` carries a real yield
    (20 raw, 14 refuted, 6 confirmed). Record its first real yield there the
    same way.
  - The workflow returns `{ confirmed, refuted, report }`; the caller publishes
    `report` as an Artifact. The workflow runtime cannot do that itself.
