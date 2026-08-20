export const meta = {
  name: 'depth-review',
  description: 'Module-depth review: 4 explorers (seam, depth, leak, decomposition), cross-corroborated, adversarially verified',
  whenToUse: "When a module or a port has grown enough that its SHAPE is worth questioning — before extracting a module from the nursery, after a port gains its second adapter, or at the end of a structural work stream. Complements /solid-review: SOLID asks whether the code respects known principles, this asks whether the boundaries are in the right places at all. Pass args.context with 2-3 lines of recent history. Origin: the module-depth review run on the field project (2026-08) whose findings became ADR-0008 and the registry / port-width / fake-fidelity guards.",
  phases: [
    { title: 'Explore', detail: 'one explorer per depth lens, independently' },
    { title: 'Verify', detail: 'one adversarial skeptic per finding' },
    { title: 'Report', detail: 'synthesise the survivors into a report' },
  ],
}

const CONTEXT = `
You are reviewing THIS repository. Before judging anything, read CLAUDE.md at
the repo root, docs/agents/domain.md (where the vocabulary lives), and the ADRs
under docs/adr/ that touch the area you are about to judge. Do not assume the
layout — this is a hexagonal, TDD-strict, idiomatic functional TypeScript
codebase, not Java OO.

Recent history (what the caller wants the explorers to know):
${args?.context ?? 'None supplied — read docs/STATUS.md yourself before judging.'}

WHAT THIS REVIEW IS. Not "does the code follow principles" (that is
/solid-review). This one asks whether the BOUNDARIES ARE IN THE RIGHT PLACES:
whether each module hides enough to be worth its interface, and whether each
seam falls where the difficulty actually is. The unit of judgement is a module
or a port, never a line.

CALIBRATION — what does NOT count here:
- Size. A long pure function with one reason to change is not shallow.
- Anything the gate already enforces and the code respects: the package graph
  (Sheriff), core purity, port width (capped at 6 callable members), the ports
  registry, ADR pointers, contract replay. Read the *.spec.ts fitness functions
  in packages/core/src/ before flagging a class of problem — if one already
  fails the build for it, say nothing.
- Speculative depth. This codebase is outside-in: a domain API is pulled into
  existence by a consumer need, never pushed just in case. "This port should
  also expose X" is a violation of the method, not a finding.
- The worked example's deliberate degeneracy. \`greet\` ships ONE adapter per
  port, and its fakes are degenerate on purpose (see the ADR 0008 pointer in
  the greet testing kit). Do not flag the example for being an example.
- Empty nurseries. packages/core/src/domain and .../application are often
  empty; that is a state, not a gap.

EXCLUDE *.spec.* files, except when a test fake or a contract IS the subject —
for the seam lens it usually is.
`

const LENSES = [
  {
    key: 'seam',
    name: 'Seam placement',
    brief: `Ask of every port: is this boundary drawn where the DIFFICULTY is?
A seam is well placed when the thing implementations genuinely differ on is the
thing the port describes. It is badly placed when the port splits at a
convenient technical line and the real variation lives underneath it, invisible.
Concretely, read each application/ports.ts, then its contract in testing/, then
every real adapter: what dimension do the adapters actually differ on — latency,
ordering, partial failure, resource lifetime — and can the contract express it?
A contract that asserts values AFTER settlement proves the port's shape, not its
behaviour in time (docs/adr/0008-port-contracts-model-the-hard-dimension.md; the
field failure was five implementations, four fakes, every fake resolving
instantly, and a caller flipping "ready" before the graph was connected).
Flag: a guarantee callers depend on that the port never wrote down; a contract
whose assertions any trivially-conformant fake passes.`,
  },
  {
    key: 'depth',
    name: 'Module depth',
    brief: `Hunt for SHALLOW modules — where the interface costs about as much to
learn as the work it hides. The test is a ratio, not a size: how much does a
caller NOT have to know because this module exists?
Look for: use-cases that forward to a single port call and add no decision;
pass-through functions that only rename their argument; wrappers whose every
parameter is threaded straight through; a port whose signature obliges the
caller to know the sequence in which to call its members (a seam that leaks its
own protocol is shallow however narrow it is).
The inverse is a finding too, but a rarer one: a module deep enough that its
interface no longer describes what it does.`,
  },
  {
    key: 'leak',
    name: 'Information leakage',
    brief: `Hunt for one design decision known in TWO places, where no compiler
link forces them to change together. This is the defect that survives every
review because each half looks reasonable alone.
Look for: adapter details surfacing in port signatures or domain types (wire
formats, storage layouts, encodings, framework shapes); a domain type whose
field names are somebody's serialisation; the same string key, index convention,
ordering assumption or unit spelled out in a core module AND an adapter; error
tags whose wording (not their tag) is relied upon outside the adapter that owns
the phrasing.
For each, name the second site and state what would silently break if only the
first were changed.`,
  },
  {
    key: 'decomposition',
    name: 'Decomposition axis',
    brief: `Ask what each module is organised BY. Modules split along the order
in which work happens (parse, then validate, then transform, then write) share
knowledge across every step, so a change to the format touches all of them.
Modules split by the knowledge they hide do not.
Look for: files whose names describe a step rather than a subject; a chain where
each module's output type is the next one's input and nothing else consumes it;
knowledge of one representation spread over a pipeline.
Also judge the nursery boundary (docs/adr/0006-emergent-feature-modules.md): a
feature module extracted before it was apparent (a folder with one file and no
second consumer), or a nursery file that has clearly become a module and is
still lying flat.`,
  },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        required: ['file', 'subject', 'title', 'evidence', 'cost', 'severity'],
        properties: {
          file: { type: 'string', description: 'repo-relative path of the primary site' },
          line: { type: 'number' },
          subject: { type: 'string', description: 'the module, port or function being judged' },
          title: { type: 'string', description: 'one-line claim about the boundary' },
          evidence: { type: 'string', description: 'what the code does, with concrete file:line citations from code you READ; for a leak, both sites' },
          cost: { type: 'string', description: 'what this costs at the next change — the concrete edit that will be harder than it should be' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          suggestion: { type: 'string', description: 'where the boundary should be instead' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['real', 'reasoning'],
  properties: {
    real: { type: 'boolean' },
    reasoning: { type: 'string' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'], description: 'adjusted severity if real' },
  },
}

const findPrompt = (lens) => `${CONTEXT}

You are the ${lens.name} explorer in a module-depth review of this codebase.
${lens.brief}

Method: scout with Glob/Grep to shortlist candidates, then READ the actual code
of each candidate AND at least one of its callers before flagging it — a
boundary can only be judged from both sides. Every finding must cite file:line
evidence from code you read.
Quality over quantity: your TOP findings only (max 4), ranked by what they cost
at the next change. If the boundaries are sound for this lens, return an empty
list — an invented finding costs the reviewer more than a missed one.
Severity: high = the next feature in this area pays for it; medium = it will
hurt when a second implementation or consumer arrives; low = worth knowing.`

const verifyPrompt = (f) => `${CONTEXT}

You are an adversarial verifier in a module-depth review. An explorer using the
${f.lens} lens claims:

Subject: ${f.subject}
File: ${f.file}${f.line ? `:${f.line}` : ''}
Title: ${f.title}
Severity claimed: ${f.severity}
Evidence: ${f.evidence}
Claimed cost: ${f.cost}
Suggested boundary: ${f.suggestion || '(none)'}

Corroboration: ${f.corroboration} of ${LENSES.length} independent explorers
flagged this file (lens${f.lenses.length > 1 ? 'es' : ''}: ${f.lenses.join(', ')}).
Treat that as a weak prior only — explorers converge on big files for boring
reasons, and one explorer reading carefully beats three skimming.

Try to REFUTE the claim. Read the cited code and its callers yourself. Refute
(real=false) if any of these hold:
- The claim misreads the code, or the cited code does not exist as described.
- The boundary is a documented, deliberate trade-off — check docs/adr/, the
  module docstring, and comments at the point of friction before deciding.
- The suggested boundary is speculative: no consumer exists today that would
  benefit, and this codebase pulls design from consumer need (outside-in).
- The "shallowness" is the worked example being an example, or a nursery file
  correctly waiting to become apparent (ADR-0006).
- A fitness function in packages/core/src/ already fails the build for this
  class of problem, so it cannot recur unnoticed.
- The stated cost is not a cost: nothing plausible would be harder to change.
Confirm (real=true) only if the boundary is genuinely misplaced AND moving it
has a payoff you can name. Set the adjusted severity if real.
Be strict: when in doubt, refute.`

const reportPrompt = (confirmed, refuted) => `${CONTEXT}

You are writing up a module-depth review. ${confirmed.length} finding(s)
survived adversarial verification; ${refuted.length} were refuted.

Survivors (JSON):
${JSON.stringify(confirmed, null, 2)}

Write a Markdown report, and return ONLY the Markdown:
- Open with two or three sentences on the shape of the result — what the
  boundaries of this codebase are like right now, not a list restated in prose.
- One section per surviving finding, ordered by severity then corroboration.
  Give each a heading naming the subject, then: what the boundary is today,
  what it costs at the next change, and where it should be instead. Cite
  file:line. Say the corroboration count only where it is above one.
- Close with "Not retained", listing the refuted claims in one line each with
  the reason they fell. This section is the honest half of the report: it is
  what stops the next reviewer re-finding them.
- Then "Harvest candidates": of the survivors, which indict the METHOD rather
  than this project — a class of problem a fitness function could settle once
  and for all. Name the guard you would write, or say none.
House voice: plain, specific, no hedging, no praise. A finding is a claim about
a cost, so state the cost.`

phase('Explore')
// A barrier, deliberately: cross-corroboration needs every explorer's findings
// at once — which file two independent lenses both landed on cannot be known
// from one lens's results.
const explored = await parallel(
  LENSES.map((lens) => () =>
    agent(findPrompt(lens), { label: `explore:${lens.key}`, phase: 'Explore', schema: FINDINGS_SCHEMA })
      .then((res) => (res?.findings ?? []).map((f) => ({ ...f, lens: lens.key })))
  )
)

const raw = explored.filter(Boolean).flat()
if (raw.length === 0) {
  log('no findings from any lens — the boundaries hold')
  return { confirmed: [], refuted: [], report: null }
}

// Corroboration is per FILE, not per claim: two lenses describing the same file
// differently are still two independent reasons to look there, and merging
// their claims would lose one of them.
const lensesByFile = new Map()
for (const f of raw) {
  lensesByFile.set(f.file, (lensesByFile.get(f.file) ?? new Set()).add(f.lens))
}
const candidates = raw.map((f) => {
  const lenses = [...lensesByFile.get(f.file)]
  return { ...f, lenses, corroboration: lenses.length }
})
const corroborated = candidates.filter((f) => f.corroboration > 1).length
log(`${raw.length} finding(s) across ${lensesByFile.size} file(s); ${corroborated} carry cross-lens corroboration`)

phase('Verify')
const judged = await parallel(
  candidates.map((f) => () =>
    agent(verifyPrompt(f), { label: `verify:${f.lens}:${f.subject}`, phase: 'Verify', schema: VERDICT_SCHEMA })
      .then((verdict) => ({ ...f, verdict }))
  )
)

const all = judged.filter(Boolean).filter((f) => f.verdict)
const confirmed = all
  .filter((f) => f.verdict.real)
  .map((f) => ({ ...f, severity: f.verdict.severity ?? f.severity }))
const refuted = all.filter((f) => !f.verdict.real)
log(`${confirmed.length} confirmed, ${refuted.length} refuted`)

if (confirmed.length === 0) {
  log('every claim fell to verification — nothing to report')
  return { confirmed, refuted, report: null }
}

phase('Report')
const report = await agent(reportPrompt(confirmed, refuted), { label: 'report', phase: 'Report' })

return { confirmed, refuted, report }
