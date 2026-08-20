export const meta = {
  name: 'solid-review',
  description: 'SOLID review: 5 investigators (one per principle), adversarial verification of every finding',
  whenToUse: "At the end of a structural work stream, to replay a full SOLID review. Pass args.context with 2-3 lines of recent history the investigators should know. Measured yield on the field project (2026-08): 20 raw findings, 14 refuted, 6 confirmed, 0 false positives surviving.",
  phases: [
    { title: 'Find', detail: 'one investigator per SOLID principle' },
    { title: 'Verify', detail: 'one adversarial skeptic per finding' },
  ],
}

// `args` arrives as a bare string from the skill launch instruction; reading
// only `args.context` silently drops the caller's history (see depth-review).
const callerContext =
  (typeof args === 'string' ? args : args?.context) ??
  'None supplied — read the project status docs yourself before judging.'

const CONTEXT = `
You are reviewing THIS repository. Before judging anything, read CLAUDE.md at
the repo root and docs/ (STATUS/architecture/ADRs under docs/adr/) to learn
the layout, the invariants and the conventions — do not assume.

Recent history (what the caller wants the investigators to know):
${callerContext}

IMPORTANT calibration — hexagonal, TDD-strict, idiomatic functional TypeScript, NOT Java OO:
- An exhaustive switch over a discriminated union in ONE place is IDIOMATIC, not an OCP violation. OCP violations = the same variant-dispatch duplicated across several files (shotgun surgery to add a variant).
- SRP applies to modules/functions: multiple unrelated reasons to change, mixed concerns.
- LSP applies to port implementations and test fakes: a fake or adapter whose semantics diverge from the contract the consumer relies on (error behavior, value domains, no-ops).
- ISP applies to ports and injected deps: an interface forcing consumers to depend on members they never use; pure pass-through dependencies.
- DIP: the package boundary is usually machine-enforced; look INSIDE each package (policy living in an adapter, hidden coupling to concrete storage shapes).
Exclude *.spec.* files except when a test fake itself is the violation. Do NOT flag things the architecture gates already enforce and that are respected.
`

const PRINCIPLES = [
  {
    key: 'srp',
    name: 'Single Responsibility',
    brief: `Hunt for SRP violations: modules or functions with several unrelated reasons to change. Look for: use-cases that both orchestrate and format/compute domain logic inline; god modules mixing concerns; adapters doing wiring + business rules + presentation. Check the biggest files first (wc -l is a good scout), then read them.`,
  },
  {
    key: 'ocp',
    name: 'Open/Closed',
    brief: `Hunt for OCP violations of the shotgun-surgery kind: adding one new variant requires editing SEVERAL files because the same dispatch/branching over that variant is duplicated. Grep for repeated switch/if-else chains over the same union across files. A single exhaustive switch in one module is FINE — only flag duplicated dispatch.`,
  },
  {
    key: 'lsp',
    name: 'Liskov Substitution',
    brief: `Hunt for LSP violations: port implementations, adapters, and test fakes whose behavior diverges from the contract the consumer relies on. Compare each port declared in the core's application layer (and its testing/ fakes and contracts) with its real adapter implementations: error behavior (throw vs resolve), value domains, ordering guarantees, no-ops. Check whether port contract suites are actually replayed against the real adapters.`,
  },
  {
    key: 'isp',
    name: 'Interface Segregation',
    brief: `Hunt for ISP violations: fat ports/interfaces/deps. Look for: ports whose consumers each use only a slice of the interface; optional methods in ports (an interface admitting it is several); injected dependency bags threaded through modules that use none of their members (pure pass-through).`,
  },
  {
    key: 'dip',
    name: 'Dependency Inversion',
    brief: `Hunt for DIP violations INSIDE each package (the core/adapter boundary itself is usually machine-enforced): core use-cases whose port signatures leak adapter details (wire formats, storage layouts); adapters reaching around ports into another module's internals; policies living in the adapter that belong in the core.`,
  },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        required: ['principle', 'file', 'title', 'description', 'severity'],
        properties: {
          principle: { type: 'string' },
          file: { type: 'string', description: 'repo-relative path' },
          line: { type: 'number' },
          title: { type: 'string', description: 'one-line claim' },
          description: { type: 'string', description: 'the evidence: what the code does, why it violates the principle, concrete file:line citations' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          suggestion: { type: 'string', description: 'sketch of the fix direction' },
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

const findPrompt = (p) => `${CONTEXT}

You are the ${p.name} Principle investigator in a SOLID review of this codebase.
${p.brief}

Method: scout with Glob/Grep/wc to shortlist candidates, then READ the actual code of each candidate before flagging it. Every finding must cite concrete file:line evidence from code you read. Quality over quantity: return your TOP findings only (max 5), ranked by real maintenance cost. If the codebase is clean for this principle, return an empty list — do not invent violations to fill the quota. Severity = practical cost: high = actively causing bug risk or shotgun surgery today; medium = will hurt at the next feature touching it; low = cosmetic.`

const verifyPrompt = (f) => `${CONTEXT}

You are an adversarial verifier in a SOLID review. A reviewer claims this ${f.principle} violation:

Title: ${f.title}
File: ${f.file}${f.line ? `:${f.line}` : ''}
Severity claimed: ${f.severity}
Evidence: ${f.description}
Suggested fix: ${f.suggestion || '(none)'}

Try to REFUTE it. Read the cited file(s) and their consumers yourself. Refute (real=false) if any of these hold:
- The claim misreads the code, or the cited code does not exist as described.
- It is theoretical OO purism with no practical maintenance cost in this idiomatic functional TypeScript codebase (e.g. flagging a single exhaustive switch as OCP).
- The "violation" is a deliberate, documented trade-off (check nearby ADRs under docs/adr/, module docstrings, comments at the point of friction).
- The suggested fix would add indirection with no consumer that benefits (outside-in rule: domain code is pulled by a consumer need, never speculative).
Confirm (real=true) only if the violation is real AND fixing it has a plausible payoff. If real, set the adjusted severity. Be strict: when in doubt, refute.`

phase('Find')
const results = await pipeline(
  PRINCIPLES,
  (p) => agent(findPrompt(p), { label: `find:${p.key}`, phase: 'Find', schema: FINDINGS_SCHEMA }),
  (res, p) => {
    if (!res || !res.findings.length) {
      log(`${p.key}: no findings`)
      return []
    }
    log(`${p.key}: ${res.findings.length} finding(s), verifying...`)
    return parallel(
      res.findings.map((f) => () =>
        agent(verifyPrompt(f), { label: `verify:${p.key}:${f.file.split('/').pop()}`, phase: 'Verify', schema: VERDICT_SCHEMA })
          .then((v) => ({ ...f, verdict: v }))
      )
    )
  }
)

const all = results.filter(Boolean).flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict && f.verdict.real)
const refuted = all.filter((f) => f.verdict && !f.verdict.real)
log(`${confirmed.length} confirmed, ${refuted.length} refuted`)
return { confirmed, refuted }
