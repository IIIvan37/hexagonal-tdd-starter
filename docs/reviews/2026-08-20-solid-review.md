# SOLID review — 2026-08-20 — the gate layer

`/solid-review`, first run on this template. 5 investigators (one per
principle), one adversarial skeptic per finding. **18 raw findings, 12 refuted,
6 confirmed**, 0 false positives surviving. 23 agents, ~7 min.

Five of the six survivors are in the **gate machinery**, one in the CLI adapter.
The hexagon's domain and use-case are again untouched — the second review in a
row to leave `greet/domain` and `greet/application` alone and land everything on
the layer [ADR-0010](../adr/0010-the-gate-layer-is-held-to-the-doctrine.md) was
written about.

Three of the six are one finding wearing three hats: **the gate has no module
for reading TypeScript**. Every detector carries a private lexer — an
interface-block state machine written twice and its regex a third time, a
comment stripper written three times of which two are byte-identical. ADR-0010
closed the *directory walk* (`scripts/source-tree.ts`); the *grammar* one layer
up was never moved, and `.jscpd.json:3` ignores `**/*.spec.ts`, so the clone
detector cannot see any of it. Findings 1, 3 and 4 should close as one change.

The other three are guards that do not guard: a port declared `export type`
escapes three detectors (proved), the "contract replayed twice" rule is already
defeated in the tree (proved), and the sink's failure branch is upheld only by a
double that throws where the real adapter cannot (proved).

## Findings

Tick a row when it is closed; archive this file when every row is ticked or
deliberately dropped.

| # | Site | Principle | Sev | Claim | Status |
|---|------|-----------|-----|-------|--------|
| 1 | [port-discipline.spec.ts:73](../../packages/core/src/port-discipline.spec.ts) | OCP | medium | A port declared `export type` escapes three guards, silently and green | ⬜ |
| 2 | [purity.spec.ts:76](../../packages/core/src/purity.spec.ts) | OCP | medium | "Where code ends and prose begins" is decided in three places, two byte-identical | ⬜ |
| 3 | [fake-fidelity.spec.ts:45](../../packages/core/src/fake-fidelity.spec.ts) | SRP | low | Every detector mixes one design rule with its own private TypeScript reader | ⬜ |
| 4 | [console-greeting-sink.ts:6](../../packages/cli/src/adapters/console-greeting-sink.ts) | LSP | medium | The real sink can never report a failed delivery; `sink-unavailable` is upheld by a lying double | ⬜ |
| 5 | [contract-discipline.spec.ts:81](../../packages/core/src/contract-discipline.spec.ts) | LSP | medium | The "replayed twice" guard counts any two spec files — and is already defeated | ⬜ |
| 6 | [eject-example.ts:115](../../scripts/eject-example.ts) | SRP | low | The eject effect owns half the taxonomy, the half no fitness function checks | ⬜ |

Findings 1–3 share a cause and should close together. Order: 1 (the grammar
module, which 2 and 3 then consume), then 5, then 4, then 6.

### 1 — a `type`-declared port escapes three guards *(medium)*

Three fitness functions each re-derive the grammar of a port from scratch, and
each fails **open** — a port it cannot parse simply vanishes from its scan, while
every "non-empty scan" sanity assertion still passes because the other ports are
found.

- `port-discipline.spec.ts:73` — `/^export interface ([\w$]+)/` opens a block,
  `line === '}'` closes it; `portWidths` (`:67-92`) counts callable members.
- `fake-fidelity.spec.ts:33` — `EXPORTED_INTERFACE`, same regex, and
  `asyncPortsOf` (`:45-69`) is the **same** state machine, differing only in the
  per-line predicate.
- `registry-discipline.spec.ts:39` — a third spelling,
  `/^export interface ([A-Za-z_$][\w$]*)/gm`, already drifted to a different
  character class.

**Proved, not argued.** The skeptic appended an eight-member port to
`greet/application/ports.ts` and ran the three specs. As
`export type ProbePort = { … }`: all three green — no width ceiling, no registry
obligation, no ADR-0008 async-port detection. The byte-identical port as
`export interface ProbePort { … }`: two failures. `biome check` accepts both.
Same declaration, guarded or unguarded purely by keyword, and the failure mode is
silent green — the one thing ADR-0010 says a gate must never do quietly.

**Correction to the raw finding.** The optional-member ratchet is *not* among the
escapes: `optionalMembers` (`:47-56`) is a flat line scan, not block-scoped, so
`h?(): void` inside a `type` alias still fails the pin. Three of the four claimed
escapes are real.

**Why this is not purism.** The repo already ruled on this exact principle one
level down. PR #44 rewrote `implementsPort` to recognise an adapter by *shape*
rather than by the `implements` keyword, with the rationale at
`fake-fidelity.spec.ts:100-107` — "a recognizer tied to `implements` is blind to
the evidence that motivated it — and a blind detector is indistinguishable from a
dormant one." That argument transfers verbatim to the port side, which the fix
never touched. The two halves of that file still disagree about the syntax of the
world; only now the disagreement is between a shape-based adapter recognizer and
a keyword-based port recognizer.

**Where the boundary belongs.** `scripts/port-grammar.ts` (or the shared reader of
finding 3) exporting `exportedInterfacesOf(source)` taught the
`export type X = { … }` form and the indented close, pinned by
`docs/port-grammar.spec.ts` with one fixture per declaration form. Per ADR-0010's
own limit — *extract the shape, not the predicates* — the three file selectors
stay at their call sites: they genuinely disagree (the registry check only wants
`application/ports.ts`), and that disagreement is the design. ADR-0010 also
demands the new scan be diffed against each old one before the extraction counts
as done.

### 2 — comment stripping, three copies, two byte-identical *(medium)*

- `purity.spec.ts:76-82` `withoutComments` — blanks block comments preserving
  newlines, then blanks whole-line `//` and `*` lines.
- `variant-discipline.spec.ts:49-55` `codeOnly` — **byte-identical body**,
  verified by diffing the two ranges. Only the name and the docstring differ.
- `public-surface.spec.ts:31-37` `blankComments` — a third, quietly divergent
  copy: it collapses block comments to a single space, destroying line numbers.

The divergence is already in the tree and currently benign only by accident:
`public-surface.spec.ts` survives its line-merging because its export-clause
regex is global. `purity.spec.ts:70-75` documents an open hole in the shared
behaviour — a trailing `// …` after code is still scanned — and closing it now
means editing three sites, one of which no longer matches the others.

Comment syntax is a closed variant set dispatched three times. Teach the gate one
new form (a JSX `{/* */}` once a downstream project adds a `.tsx` adapter under
ADR-0007) and a missed copy diverges silently.

**Fix.** One `codeOnly(source)` in `scripts/`, alongside `source-tree.ts`, pinned
by its own spec in `docs/`. All three consume it; `public-surface.spec.ts` does
not need the line numbers but nothing breaks if it gets them. Plumbing cost is
nil — `purity.spec.ts` and `variant-discipline.spec.ts` already import from
`scripts/source-tree.ts`.

### 3 — one detector, two reasons to change *(low)*

The generalisation of 1 and 2: each design fitness function mixes ONE design rule
with a private lexical reader, and the reader half is re-derived per file. Beyond
the interface scanner and the comment stripper, brace-balanced block extraction
appears twice in `fake-fidelity.spec.ts` alone (`:84-92` `unconditionalSettlers`,
`:128-147` `blockAt`), with a character-level cousin at
`docs/claude-assets.spec.ts:125-134`.

**Severity low, deliberately.** The skeptic anchored it on the repo's own
calibration: the depth review rated the *nine-way* walker clone low and called it
"a decision to record, not an urgent repair". Two to three copies of a ~15-line
shape cannot outrank that. It is listed separately from 1 and 2 because it names
the *address* — `scripts/ts-source.ts`, declaration in `scripts/`, fitness
function in `docs/` — that 1 and 2 both need, and because the counter-cost is
real: every additional `scripts/` module raises the copy tax under
[ADR-0009](../adr/0009-method-travels-by-copy-and-harvest.md).

### 4 — the sink cannot fail, but the use-case believes it can *(medium)*

`ConsoleGreetingSink.save` is bare `console.log(greeting.message)`
(`console-greeting-sink.ts:6-8`): it neither awaits the drain nor propagates a
write error, and Node's global `console` is built with `ignoreErrors: true`.

**Proved.** `node packages/cli/src/main.ts Ada > /dev/full` exits 0 having
delivered nothing; the same write through `process.stdout.write('hi', cb)`
surfaces ENOSPC. The failure is real; `console` swallows it.

The consumer relies on the opposite. `greet.ts:63-67` wraps `deps.sink.save(…)`
and maps a rejection to `{ kind: 'sink-unavailable' }`, `report.ts:39-43` maps
that to exit 69, and `packages/core/src/application/README.md:21` documents the
outcome as reachable. Every proof of that branch comes from a double whose
semantics diverge from the adapter: `run.spec.ts:80-84` mocks `console.log` to
throw under the comment "A closed pipe (`greet Ada | head -0`) is the realistic
version of this" — which the run above shows is factually false.

The contract cannot see the divergence, and the reason is worse than the raw
finding claimed: `console-greeting-sink.spec.ts:12-18` builds the subject's
`emitted()` from `vi.spyOn(console, 'log')`, so the obligation "delivers the
message of the greeting it is given" is proven against the **call**, not the
destination. A sink writing to `/dev/full` passes the entire contract.

**Fix — one branch only.** Write through `process.stdout.write` with its callback
awaited (or a `Console` with `ignoreErrors: false`) so `save()` actually rejects,
add the failure obligation to `greetingSinkContract`, and correct the false
comment in `run.spec.ts`. The raw finding's alternative — delete the
`sink-unavailable` variant as unreachable — is **wrong** and must not be taken:
the narrow `try` around a single port call is doctrine (CLAUDE.md invariant 3),
so the tag stays.

Blast radius is the explicitly disposable example slice, and the harm is
pedagogical — a model that gets copied, plus a spec comment teaching a false
picture of Node.

### 5 — the "replayed twice" guard is already defeated *(medium)*

The rule is stated at `contract-discipline.spec.ts:16-22`: every `*Contract`
suite "must be replayed by at least two spec files: the reference fake AND one
real adapter", harvested from a field project where "the replay against the real
adapter was silently LOST in a refactor". The implementation only counts call
sites (`:81-84`) with a bare substring test —

```ts
specs.filter((path) => readFileSync(path, 'utf8').includes(`${name}(`))
```

— asserted `toBeGreaterThanOrEqual(2)` (`:90`). Nothing partitions the
callers into kit and adapter, although the distinction is one line away:
`normalized(path).includes('/testing/')` already draws it at `:54`.

**Proved — and worse than the raw finding argued.** The current tallies are
`nameSourceContract` 2, `greetingSinkContract` 2, `clockContract` **3** — the
third "caller" being `registry-discipline.spec.ts:120`, whose *fixture string
literal* `'export function clockContract(\n…'` matches the substring test. So the
regression needs no contrived conjunction: the skeptic deleted the
`clockContract('SystemClock', …)` replay from `system-clock.spec.ts:7` and the
gate stayed **green**, with `SystemClock` no longer held to a single port
obligation. One deletion, no compensating edit.

**Fix.** Partitioning on `/testing/` alone does **not** close it — the false
caller sits outside `testing/` and would satisfy the "real adapter" side. The fix
must both partition (≥1 replay under a `testing/` directory, ≥1 outside, both
named in the failure message) *and* stop counting incidental substring matches:
require the spec to import the contract from `@app/core/testing`, or match a call
at statement position. Add a fixture-level test of the partition — that is what
would have caught this in the first place.

This is the guard every scaffolded project copies under ADR-0009, and it is
currently provable-by-experiment to not do what its own docstring says.

### 6 — the eject effect owns half the taxonomy *(low)*

`scripts/eject-taxonomy.ts:1-8` states the split: "Declaration only … Its
neighbour `scripts/eject-example.ts` owns the effect." Four pieces of "what the
example consists of" are declared in the effect module anyway —
`eject-example.ts:115` (the registry README's membership, while its stub content
sits correctly in the taxonomy), `:117-121` (a path **and** the exact prose
sentence to find), `:131-132` (the example-only dependencies), `:135` (the
`greet` → `start` rename). PR #44's cross-check cannot see any of it:
`markedFiles` runs through `sourceFiles`, which filters `name.endsWith('.ts')`.

**The skeptic cut this down, and the cut is the useful part.** Three of the four
sites are deliberately loud — `dropDependency`, `renameScript` and
`rewriteMention` each report a zero match, and the comment at `:37-42` documents
that as the considered answer to precisely this failure mode. And relocating
`EXAMPLE_DEPENDENCIES`/`EXAMPLE_SCRIPTS` buys no check: a forgotten *addition* is
underivable from either representation, so no both-ways assertion exists for
them.

**What survives is small and worth doing.** The registry README's path belongs
beside its own stub in the taxonomy, and the `{path, search, replace}` mention is
the one item with a rot mode a gate-time assertion actually catches — the prose in
`domain/README.md:21` is the kind of sentence a docs edit rewords, after which
the drift is discovered by a downstream stranger's eject warning instead of by
this repo's gate. Roughly ten lines, with an existing consumer
(`docs/eject-taxonomy.spec.ts`) — not the four-structure refactor proposed.

Note in passing: `README.md:147` promises that `grep -rln "EXAMPLE" packages` is
"the full list, always current". The two markdown skeleton files carry no marker,
so it is not.

## Not retained

Twelve findings were refuted by their skeptic. Recorded so the next run does not
re-raise them.

| Site | Principle | Claim | Why it was refuted |
|------|-----------|-------|--------------------|
| `docs/docs.spec.ts:120` | SRP | Two unrelated fitness functions in one file, and the second one has a weaker duplicate | The duplicate is a documented, deliberate trade-off — reuse was tried and rejected on substance |
| `packages/cli/src/run.ts:20` | SRP | The composition root owns CLI wording that belongs to `report.ts` | Misreads the boundary: ADR-0004 draws it at core/adapter, not between two adapter files; the fix is net-negative |
| `contract-discipline.spec.ts:52` | OCP | "Which files are production sources" has five spellings that disagree about `.tsx` | The three predicates in that file answer three different questions; the remaining divergence is documented at the point of friction |
| `contract-discipline.spec.ts:40` | LSP | The fake-drift allowlist is empty and its mechanism has never executed | Not a substitutability violation, out of scope, and the headline fix proved counterproductive when tried |
| `greet/testing/port-contracts.ts:55` | LSP | The `NameSource` contract obligates a re-readability no consumer needs | Not an LSP failure: an over-strong obligation constrains the *next* adapter, it does not break the current one |
| `scripts/eject-taxonomy.ts:132` | ISP | The taxonomy's surface is split by consumer rather than by concept | Named ES-module exports force no consumer to depend on anything unused — ISP does not apply |
| `scripts/source-tree.ts:59` | ISP | `filesUnder`'s predicate forces 10 of 13 call sites to write an unused `_path` | Counts are right; a two-arg predicate with three real users is not an interface consumers are forced through |
| `scripts/arch-map.ts:34` | ISP | `ModuleNode.tags` is carried by every node and read by none | Fact confirmed, but it is dead weight inside one module, not a segregation failure |
| `scripts/mutation-diff.ts:20` | DIP | Re-derives the source layout `source-tree.ts` owns, and fails silently | Different vocabulary: `packageRoots()` returns absolute paths for every package; the mutation scope is core-only and relative |
| `greet/application/greet.ts:33` | DIP | The use-case codes to a failure protocol its ports never declare | ADR-0004 states that protocol verbatim; `cause` never picks an exit code |
| `scripts/modules-hint.ts:14` | DIP | "The nursery is `{domain,application}`" is re-spelled in four unlinked places | Three sites at three different granularities; the fix pays ADR-0010's copy tax for a payoff no consumer needs |
| `packages/cli/src/run.ts:19` | DIP | The composition root hardcodes a message and an exit code, bypassing `report.ts` | The exit code is imported from `report.ts`; only the usage string is inline, and `report()` prints nothing |

## What this run taught about the workflow

- **The skeptic that runs the code beats the skeptic that reads it.** Three of
  the six survivors were established by *experiment* — a probe port compiled and
  scanned, `> /dev/full` against the shipped binary, a contract replay deleted to
  watch the gate stay green. Two of those three experiments also corrected the
  finding they confirmed (the optional-member ratchet does not escape; the
  phantom third caller is a fixture string). The depth review's skeptics refuted
  by citation; these refuted by execution, and the reports are stronger for it.
  Worth making explicit in the verify prompt.
- **Single-principle findings again.** Every survivor came from one investigator.
  This replays the depth review's calibration — cross-lens corroboration is an
  anti-signal — on a different axis, which is now two runs and no
  counter-example.
- **ISP and DIP produced 0 of 7.** ISP's three findings all read a *module's
  named exports* as an interface consumers are forced through, which ES modules
  make false by construction. DIP's four all read a documented decision as an
  undeclared dependency. Both lenses would benefit from the precondition the
  `leak` lens gained: name the decision your claim contradicts, or drop it.
- **The gate layer is where the findings are.** Two consecutive reviews, eleven
  survivors between them, ten in `scripts/` and the fitness functions. That is
  ADR-0010's premise confirmed by measurement rather than by argument — and a
  reason to keep pointing both workflows at that layer.

Per-principle yield (kept / raw): OCP 2/3, SRP 2/4, LSP 2/4, ISP 0/3, DIP 0/4.
