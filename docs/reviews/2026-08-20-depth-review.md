# Depth review — 2026-08-20 — packages/core

`/depth-review`, first real run. 4 explorers (seam, depth, leak, decomposition),
one adversarial skeptic per finding. **14 raw findings, 9 refuted, 5 confirmed**,
0 false positives surviving. 19 agents, ~10 min.

Every survivor lives in the **gate machinery or the build scripts** — none in the
hexagon, none in `greet/`, no port. Four of the five share one defect: a piece of
knowledge that has no module and is re-derived at every site, in files
`.jscpd.json` is configured not to scan.

## Findings

Tick a row when it is closed; archive this file when every row is ticked or
deliberately dropped.

| # | Site | Lens | Sev | Claim | Status |
|---|------|------|-----|-------|--------|
| 1 | [fake-fidelity.spec.ts:234](../../packages/core/src/fake-fidelity.spec.ts) | seam | medium | The ADR-0008 guard counts adapters by the `implements` keyword, so a functional adapter leaves it asleep | ✅ |
| 2 | [eject-example.ts:49](../../scripts/eject-example.ts) | decomposition | medium | The skeleton taxonomy is declared twice and only one direction is checked | ✅ |
| 3 | [source-tree.ts](../../scripts/source-tree.ts) | decomposition | low | The source-tree walker is re-derived in 8 detectors, where jscpd is configured not to look | ✅ |
| 4 | [arch-map.ts:137](../../scripts/arch-map.ts) | depth | low | The generator hides the fold but leaks how to acquire its input | ✅ |
| 5 | [result.ts:25](../../packages/core/src/shared/result.ts) | depth | low | `isOk`/`isErr` have no consumer outside their own spec | ✅ |

### 1 — the fake-fidelity recognizer *(medium)* — ✅ closed 2026-08-20

> **Closed.** The recognizer now turns on `implementsPort`, which reads the port
> in any implementation position — `implements X`, `const a: X =`, `): X`,
> `} satisfies X`. `bodiesImplementing` scans declaration blocks rather than
> class headers, so an object-literal or factory adapter yields its body, and
> `ASYNC_METHOD` learned the `load: async () =>` property form. Seven fixtures
> cover the idioms one by one, and an eighth runs the whole chain on
> `load: async () => {}` closed by `satisfies` — the exact shape ADR-0008's
> Context quotes. The real tree still reports one adapter per async port, so the
> guard stays dormant for the right reason.

`realAdapters` (`fake-fidelity.spec.ts:234-239`) counts a production file as an
adapter only if it matches `/implements\s+[^{]*\bPort\b/`, and
`bodiesImplementing` (`:99-101`) recognises a fake only as
`class X … implements Port`. The other half of the same file is style-agnostic:
`asyncPortsOf` (`:35-59`) accepts both `load(): Promise<string>` and
`readonly load: () => Promise<string>`. The two halves disagree about what syntax
the world is written in, and the adapter half is calibrated to the worked example
rather than to the idiom CLAUDE.md declares.

**Cost.** The only survivor whose cost is a shipped defect rather than a confused
contributor. If the first real feature's second adapter is
`export const httpNameSource: NameSource = {…}`, a `createStdinNameSource()`
factory, or a structurally-conformant class without the redundant `implements`
clause, `realSeams` returns empty and the assertion at `:249-272` passes for the
wrong reason, identically to the right one. ADR-0008's own Context quotes the
field-project fakes as `load: vi.fn(async () => {})` — an object-property fake.
The evidence that motivated the detector is written in the style the detector
cannot see. Under [ADR-0009](../adr/0009-method-travels-by-copy-and-harvest.md)
the blind copy then travels into a project whose author has no reason to doubt it.

**Where the boundary belongs.** At *what counts as an implementation of this
port*, not at a keyword. Count the port type in any implementation position —
`implements NameSource`, `: NameSource =`, `): NameSource` — and widen
`bodiesImplementing` and `ASYNC_METHOD` the same way; fixing only the counting
side leaves the body side blind to an object-literal fake. Add one fixture per
idiom to the existing `describe('the detectors themselves')` block. The cheaper
honest alternative: make the convention mechanical and fail the gate on a port
implementation that omits `implements`.

### 2 — the eject taxonomy, checked one way *(medium)* — ✅ closed 2026-08-20

> **Closed.** The prerequisite was a boundary, not a test:
> [scripts/eject-taxonomy.ts](../../scripts/eject-taxonomy.ts) now holds the
> declaration — markers, stubs, `markedFiles()` — and
> [eject-example.ts](../../scripts/eject-example.ts) owns the effect, the way
> `arch-map.ts` already separates them.
> [docs/eject-taxonomy.spec.ts](../eject-taxonomy.spec.ts) asserts both
> directions, that stubs name real files, and that the markers stay disjoint;
> both directions were proven to fail on injected drift before being trusted.
> The three exact-string edits now report a zero match instead of no-oping.
> One licensed empty state — an already-ejected project — because without it
> the ejected skeleton is red, which the run proved.
>
> **Follow-up this raised:** the eject machinery survives into every scaffolded
> project, where it has nothing left to describe. Whether the eject should
> remove itself (script, taxonomy, spec and the `eject:example` entry) is a
> decision this step did not take.

"Which files are skeleton" is declared twice: once per file on line 1
(`EXAMPLE (greet slice) — DELETE`, `EXAMPLE CONTENT, SKELETON ROLE`, `KEEP`),
which README advertises as "the full list, always current"; once as `STUBS`, a
literal-path-keyed record (`eject-example.ts:49-126`). The deletion half honours
the markers by walking the tree; the rewrite half iterates the map and warns only
when a listed path lacks a marker. The reverse — a file marked `SKELETON ROLE`
that nobody added to `STUBS` — is silent. Six markers, six keys, agreeing by
coincidence: no spec covers `scripts/`, and CI never runs the eject.

**Cost.** Already drifted three times (`01e03a4`, `5fee495`, `a523b40` — that
last one caught by a human review, not a check). Several drift modes are loud,
which is why this is medium: a stale key crashes on `readFileSync`; a new file
importing a DELETE-marked one goes red at typecheck. The silent case is the one
that matters — a new skeleton-role file that still typechecks after the eject and
ships greet-flavoured content into someone's fresh project. Separately,
`dropDependency` (`:154-161`) no-ops silently: README tells the reader to rename
packages *before* tearing out the example, after which
`dropDependency('packages/cli/package.json', 'dependencies', '@app/core')`
matches nothing, says nothing, and knip fails the ejected skeleton's gate.

**Where the boundary belongs.** The marker becomes the single representation:
walk once, partition by marker, assert that the `SKELETON ROLE` set equals
`Object.keys(STUBS)`, fail on either mismatch. Two corrections to the obvious
fix. The spec belongs in `docs/`, beside `architecture.spec.ts` —
`vitest.config.ts` includes only `packages/*/src/**` and `docs/**`, so a
`scripts/eject-example.spec.ts` would never run. And it cannot be written against
the file as it stands: `eject-example.ts` performs its whole effect at module
scope and exports nothing, so importing it to read `STUBS` runs the eject. The
real defect is one level below the duplication — the module fuses its taxonomy
declaration with its effectful main, where its neighbour `arch-map.ts` separates
them. Export the taxonomy first.

### 3 — the source tree, re-derived eight times *(low)* — ✅ closed 2026-08-20

> **Closed**, by extraction rather than by exemption.
> [scripts/source-tree.ts](../../scripts/source-tree.ts) holds `normalized`,
> `packageRoots()` and `filesUnder(dir, keep)`; nine detectors import it —
> eight named below, plus `scripts/eject-taxonomy.ts`, which was born with a
> **ninth copy** one commit after this review predicted it ("the next change
> here writes a ninth copy"). The module holds the SHAPE of the walk and not
> the predicates: "what counts as a production source" still differs per
> detector, and unifying those would have changed what each one sees.
>
> The counter-cost this finding asked to price decided the address. Under
> `packages/core/src/` the module would land in Stryker's mutate globs, the
> 100 % coverage thresholds, knip's view and Sheriff's tagging — production
> weight for gate machinery. In `scripts/` it carries none of those and is
> still scanned by jscpd (only `*.spec.ts` is ignored), so a tenth copy has to
> be argued for. This follows the address finding 2 had just established for
> `eject-taxonomy.ts`: declaration in `scripts/`, fitness function in `docs/`.
>
> **Verified, not assumed.** Folding nine walkers into one concentrates a risk
> the clones diffused — every detector now scans whatever this module says the
> tree is, and each only asserts its scan is non-empty, which catches a total
> failure and not a partial one. A throwaway probe reimplemented each old
> private walker and diffed its output against the new one: all nine scans
> identical, file for file. [docs/source-tree.spec.ts](../source-tree.spec.ts)
> pins the rest, and its two artefact-skip cases were **rewritten after they
> were caught passing vacuously** — against the real repo they were green even
> with the skip deleted, because `packages/cli/node_modules` holds only a
> symlink and `.stryker-tmp` does not exist between mutation runs. They run
> against a synthetic tree now, and were proven to fail on injected drift.
>
> **What the eject caught.** The first version of that spec asserted recursion
> by naming `greet/domain/greeting.ts`, which turned the *ejected* skeleton
> red — the same trap finding 2 licensed an empty state for. The assertion is
> structural now (some hit sits in a subdirectory), and the eject was replayed
> end-to-end: skeleton green, 172 passed, 100 % coverage.



Eight detectors each carry a private recursive walker over `packages/*/src`,
differing only in the filename predicate: `contract-discipline:38`,
`fake-fidelity:132` (character-for-character identical), `registry-discipline:44`,
`adr-pointers:18`, `port-discipline:38`, `variant-discipline:66`,
`public-surface:85`, `purity:127`. `packageRoots()` is byte-identical in four;
`normalized` in three. `.jscpd.json` ignores `**/*.spec.ts`, so the repo's
threshold-0 clone doctrine is structurally blind here — the exclusion was
configured, this eight-way clone was never decided.

**Cost.** The downstream half of ADR-0009: a consuming project with an `apps/`
root beside `packages/` edits eight near-identical private functions with no
clone detector and no compiler to name the one it missed. A total under-scan is
caught — every detector asserts a non-empty scan — a partial one is not. And
`/template-harvest` exists to add fitness functions, so the next change here
writes a ninth copy.

**Where the boundary belongs.** One small non-spec module exporting
`packageRoots()`, `filesUnder(root, predicate)` and `normalized(path)` —
`registry-discipline.spec.ts:44` has already generalized the walker to exactly
that shape. Price the counter-cost first: a file under `packages/core/src/` lands
inside the mutation scope, the 100 % coverage thresholds, knip's view and
Sheriff's tagging. This is a decision to record plus a narrowed jscpd ignore so
the ninth copy has to be argued for — not an urgent repair.

*Two supporting claims did not survive and should not be re-raised:* the
`.stryker-tmp` skip was copied forward at each file's birth rather than
retrofitted, and it is inert everywhere, since every walker starts below
`packages/<pkg>/src` while `.stryker-tmp` sits at the repo root.

### 4 — the arch-map generator's leaked protocol *(low)* — ✅ closed 2026-08-20

> **Closed.** `arch-map.ts` exports two steps instead of one: `currentMermaid(root)`
> (acquire the graphs and fold them) and `docOf(mermaid)` (the document around
> the map). `writeArchitectureMap` is now one line composing them, and
> `docs/architecture.spec.ts` no longer imports `config` or `getProjectData` at
> all — it asserts the path `pnpm arch:map` actually runs.
>
> One thing was made stronger than the finding asked. The spec compared only
> the fenced block, so the prose above it — generated output, and labelled "do
> not edit by hand" — could be hand-edited with the gate still green. It now
> compares the WHOLE document against `docOf(currentMermaid(ROOT))`. Proven by
> injection: a one-word edit to the prose is red, and was green before.



`mermaidOf(datas)` (`arch-map.ts:121`) takes graphs already fetched;
`writeArchitectureMap(root)` (`:137`) fetches and writes in one breath. The
fitness function must not write the file, so it restates that expression verbatim
at `docs/architecture.spec.ts:150-154`, importing `config` from
`sheriff.config.ts` and `getProjectData` from `@softarc/sheriff-core` purely to
reconstruct it. The one non-obvious fact about this map — that it is the fold of
one `getProjectData` per Sheriff entry point, and that a missing `entryPoints`
means an empty graph — is caller knowledge held in two places.

**Cost.** Narrower than it looks: both sites read `config.entryPoints`, so
changing entry points moves both together. Divergence needs a change to the
*shape* of acquisition, and then the gate fails loudly but misleadingly —
`pnpm arch:map` writes one graph, the spec computes another, and the message is
"ARCHITECTURE.md drifted from the tree… regenerate it" for a map that was just
regenerated. One fact strengthens the case: `writeArchitectureMap` has no test at
all. The checker verifies its own copy of the protocol, never the path
`pnpm arch:map` runs.

**Where the boundary belongs.** Export the acquisition step as the module's seam:
`currentMermaid(root: string): string`, with `writeArchitectureMap` reduced to
`writeFileSync(…, docOf(currentMermaid(root)))` and the spec comparing the
committed block against `currentMermaid(ROOT)`. `mermaidOf` stays exported for
the six unit tests that feed it synthetic graphs. About five lines.

### 5 — two guards that rename the discriminant *(low)* — ✅ closed 2026-08-20

> **Closed.** Both guards are gone; `ok`, `err` and the `Result` type are the
> kernel's whole surface. The two spec cases were not simply deleted — they
> were rewritten to narrow on the discriminant directly, so the file now
> demonstrates *why* there is no guard rather than leaving a silence a future
> contributor would fill. `result.ts` drops from 10 mutants to 6, all killed:
> the 100 % mutation score is no longer partly bought on code no production
> path executes.



`isOk` returns `result.ok`, `isErr` returns `!result.ok` (`result.ts:25-36`).
TypeScript narrows on the discriminant for free, and every real call site does
exactly that (`greet.ts:59`, `run.ts:30`). A repo-wide grep finds the two guards
only in their own definition and in `result.spec.ts`. `index.ts` exports the
`Result` *type* alone, so `public-surface.spec.ts` never sees them, and knip's
`ignoreExportsUsedInFile` lets the spec count as the consumer. `ok`/`err` by
contrast have production consumers, so the finding isolates precisely the two
members that have none.

**Cost.** Idiomatic, and it compounds by copying: `result.ts` is marked
`KEEP — generic skeleton` and survives `pnpm eject:example` untouched, so every
scaffolded project inherits both, and the kernel is the first file a new slice
reads. Smaller and secondary: `shared/` is in mutation scope, so the 100 %
mutation score is partly bought by killing mutants in code no production path
executes.

**Where the boundary belongs.** Delete both guards and their two spec cases;
leave `ok`, `err` and the `Result` type as the kernel's surface. CLAUDE.md's rule
is that `shared/` grows by promotion on a second consumer, and these arrived with
none. The repo has already litigated this in the other direction:
`public-surface.spec.ts`'s docstring records its first run catching
`buildGreeting`, "exported since day one and consumed by nobody". Re-add a guard
when a call site needs one as a value — `results.filter(isOk)`.

## Not retained

The nine refuted claims, one line each, with the ground that killed it. This is
what stops the next reviewer re-finding them.

| Site | Lens | Claim | Why it fell |
|------|------|-------|-------------|
| `greet/application/ports.ts:6` | seam | `NameSource` is drawn after the acquisition it names, so its adapter is byte-identical to its fake | Factually wrong — `greet.ts:50-55` maps a throw to `{ kind: 'source-unavailable' }`, `report.ts` handles it exhaustively, and `FailingNameSource` exists to drive that path |
| `greet/testing/port-contracts.ts:149` | seam + leak | The sink contract asserts "await means delivered" while the adapter knows it does not | [ADR-0008](../adr/0008-port-contracts-model-the-hard-dimension.md) is about exactly this, names `InMemoryGreetingSink.save()`, and defers the fix until the port has two real adapters |
| `packages/cli/src/report.ts:30` | depth + decomposition | `report` is drawn around the core's error union, not the CLI's failure set | The seam is where [ADR-0004](../adr/0004-errors-as-tagged-values.md) puts it: `report` is the domain-error mapping, and a missing argv slot is not a domain error |
| `greet/domain/instant.ts:13` | leak | The timezone-offset direction is declared in the core and re-derived in the adapter | That is the adapter doing its job — a convention declared once and translated once at the edge, away from `Date.getTimezoneOffset`'s foreign sign |
| `core/src/application/README.md:19` | leak | The CLI's wording and exit codes are transcribed into a file inside the core | The invariant is about code; the core compiles knowing no string. `registry-discipline.spec.ts:29` explicitly blesses the *Implemented by* column naming CLI classes |
| `greet/application/greet.ts:26` | leak | An adapter-authored sentence transits the core in `cause: string` | ADR-0004's rule is about branching and wording — `report.ts` switches on `kind` alone, and `cause` never picks an exit code |
| `greet/testing/port-contracts.ts:37` | seam + leak | The sink contract encodes the console's output shape | [ADR-0002](../adr/0002-port-contracts-in-a-testing-subpath.md) says adapter-specific assertions belong in the adapter's own spec; `emitted` is subject-supplied |
| `packages/cli/src/report.ts:30` | depth + decomposition | Presentation is split by where the failure came from, and wording has diverged | Misreads the eject script — the ejected `run.ts` has no argv parsing and no `usage:` wording; it is a placeholder for an absent feature |
| `scripts/mutation-diff.ts:71` | decomposition | What is mutable is decided in two modules | Not a boundary, and the divergence is the contract: the diff run mutates only touched files, and CLAUDE.md names the full run authoritative |

## What this run taught about the workflow

Recorded here because the review's own calibration is part of its output. All
three were fixed in `.claude/workflows/depth-review.js` in the same step.

- **The report could not name what it rejected.** `reportPrompt` accepted
  `refuted` but interpolated only `refuted.length`, while asking for a "Not
  retained" section — the report said so itself. The verdicts are now passed in.
- **Both workflows reviewed with no caller history.** They read `args?.context`,
  but the launch instruction the runtime generates renders `args` as a bare
  string. Both now accept either shape.
- **Cross-lens corroboration is an anti-signal.** All 4 corroborated findings
  were refuted; all 5 survivors came from a single lens. Twice, two lenses
  agreeing meant they shared one misreading.
- **The `leak` lens produced 5 raw, 0 kept** — four killed by the same sentence,
  that an ADR already decided the trade-off. It gained a precondition: name the
  decision your claim contradicts, or drop the claim.

Per-lens yield (kept / raw): decomposition 2/5, depth 2/4, seam 1/4, leak 0/5.
