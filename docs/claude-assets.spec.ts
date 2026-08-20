import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Fitness function for `.claude/` — the skills and workflows that ARE the
 * method.
 *
 * [ADR-0009](adr/0009-method-travels-by-copy-and-harvest.md) settles that these
 * files travel by COPY: every project scaffolded from this template gets its
 * own `.claude/`, adapts it, and never links back. That is what makes the
 * bargain work, and it is also what makes a broken asset expensive — the defect
 * is copied with everything else, into a project whose author has no reason to
 * doubt it.
 *
 * Nothing else in the toolchain looks at these files. `.claude/**` is excluded
 * from Biome and Knip on purpose (a workflow script follows the workflow
 * runtime's rules, not the app's), so a skill can name a `pnpm` script that was
 * renamed two commits ago, link an ADR that moved, or start a phase its own
 * `meta` never declares, and every check in `pnpm gate` stays green. The person
 * who finds out is the one following the instruction.
 *
 * The rules below are the ones a machine can settle: does the thing this file
 * names exist, and does the file agree with itself. Whether the ADVICE is good
 * is a review question and stays one.
 *
 * It lives in `docs/` rather than beside what it guards for the same exclusion
 * reason: a spec under `.claude/` would be the one TypeScript file in the tree
 * that Biome never formats and `tsc` never sees. The vitest include already
 * covers spec files under `docs/`, next to the other fitness functions over
 * hand-written text.
 *
 * One thing it deliberately does NOT know: which scripts survive
 * `pnpm eject:example` (it renames `greet` to `start`). A skill naming an
 * example-only script passes here and breaks on the ejected skeleton — that is
 * the eject replay's job, not this one's.
 */

const DOCS = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(DOCS, '..')
const CLAUDE = join(ROOT, '.claude')
const SKILLS = join(CLAUDE, 'skills')
const WORKFLOWS = join(CLAUDE, 'workflows')

/** A skill's single entry point; the directory name is its identity. */
const ENTRY_POINT = 'SKILL.md'

const FRONTMATTER = /^---\n([\s\S]*?)\n---/
const FRONTMATTER_FIELD = /^([a-z][\w-]*):[ \t]*(.*)$/

/** The literal the workflow runtime requires at the top of every script. */
const META_OPENS = 'export const meta = {'

/**
 * The runtime hooks a script may call. They are not imported — the runtime
 * supplies them — so naming them here is what lets the body parse in isolation.
 */
const RUNTIME_GLOBALS = [
  'args',
  'agent',
  'parallel',
  'pipeline',
  'phase',
  'log',
  'budget',
  'workflow'
]

/** Phase titles declared in `meta.phases`. */
const DECLARED_PHASE = /title:\s*'([^']+)'/g

/** Phases the body actually uses — `phase('X')` starts a group, and
 * `{ phase: 'X' }` on an agent assigns to one. The runtime matches both by
 * exact string, so a typo silently opens a group nobody named. */
const STARTED_PHASE = /\bphase\(\s*'([^']+)'/g
const ASSIGNED_PHASE = /\bphase:\s*'([^']+)'/g

/** A `pnpm` command quoted as code. The backtick is the discriminator: it
 * separates an instruction the reader will run from prose about pnpm. */
const QUOTED_PNPM = /`pnpm ([a-zA-Z][\w:.-]*)/g

/**
 * A repo path named in workflow prose, anchored on a known top-level directory.
 *
 * `docs/docs.spec.ts` already checks path truth for the SKILLS, and its
 * detector is the better one — but it reads backticked spans and markdown link
 * targets, and a workflow's prose lives inside a template literal, where a
 * backtick would end the string. So the skills keep that detector, workflows
 * get this one, and neither file checks the other's surface. Anchoring on a
 * real root is what replaces the prose-or-path heuristics: `try/catch` and
 * `feat/some-branch` never match in the first place.
 */
const ROOTED_PATH =
  /(?<![\w./-])((?:packages|docs|scripts|\.claude|\.github)(?:\/[\w.-]+)+\/?)/g

const read = (path: string): string => readFileSync(path, 'utf8')

const entriesIn = (dir: string, keep: (e: { name: string }) => boolean) =>
  readdirSync(dir, { withFileTypes: true })
    .filter(keep)
    .map((e) => e.name)

const capturesOf = (source: string, pattern: RegExp): readonly string[] =>
  [...source.matchAll(pattern)].map((match) => match[1] ?? '')

function parseFrontmatter(
  source: string
): Readonly<Record<string, string>> | null {
  const block = FRONTMATTER.exec(source)
  if (block === null) return null
  const fields: Record<string, string> = {}
  for (const line of (block[1] ?? '').split('\n')) {
    const field = FRONTMATTER_FIELD.exec(line)
    if (field !== null) fields[field[1] ?? ''] = (field[2] ?? '').trim()
  }
  return fields
}

/**
 * The `meta` object literal, by brace matching. The runtime already forbids
 * anything but a pure literal there — no calls, no interpolation — which is
 * what makes counting braces enough.
 */
function metaBlockOf(source: string): string | null {
  const start = source.indexOf(META_OPENS)
  if (start === -1) return null
  let depth = 0
  for (let i = start + META_OPENS.length - 1; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
  }
  return null
}

/**
 * A workflow script is not a module: the runtime wraps the body in an async
 * function, so a top-level `return` — which every script ends on — is correct
 * there and a syntax error anywhere else. That is why `node --check` cannot
 * validate one (it rejects the `return`), and why this reconstructs the real
 * shape instead. The body is COMPILED, never called.
 */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...parameters: readonly string[]
) => unknown

function parseErrorOf(source: string): string | null {
  try {
    new AsyncFunction(
      ...RUNTIME_GLOBALS,
      source.replace(/^export const meta =/m, 'const meta =')
    )
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

interface Asset {
  /** How the failure message should name it, repo-relative. */
  readonly label: string
  readonly path: string
  readonly source: string
}

const skillDirs = entriesIn(SKILLS, (e) => !e.name.startsWith('.'))

const skills = skillDirs.map((dir) => {
  const path = join(SKILLS, dir, ENTRY_POINT)
  return {
    dir,
    path,
    label: `.claude/skills/${dir}/${ENTRY_POINT}`,
    source: existsSync(path) ? read(path) : null
  }
})

const workflows = entriesIn(
  WORKFLOWS,
  (e) => e.name.endsWith('.js') && !e.name.startsWith('.')
).map((name) => ({
  name,
  path: join(WORKFLOWS, name),
  label: `.claude/workflows/${name}`,
  source: read(join(WORKFLOWS, name))
}))

/** Every hand-written asset, for the checks that do not care which kind it is. */
const assets: readonly Asset[] = [
  ...skills.flatMap((s) =>
    s.source === null
      ? []
      : [{ label: s.label, path: s.path, source: s.source }]
  ),
  ...workflows.map((w) => ({ label: w.label, path: w.path, source: w.source }))
]

describe('.claude/skills say what they are', () => {
  it('gives every skill directory a SKILL.md', () => {
    const missing = skills.filter((s) => s.source === null).map((s) => s.label)
    expect(
      missing,
      '\nA skill directory with no SKILL.md is invisible: the loader has' +
        '\nnothing to read, so the skill silently does not exist.'
    ).toEqual([])
  })

  it('opens every SKILL.md with name and description frontmatter', () => {
    const incomplete = skills.flatMap((s) => {
      if (s.source === null) return []
      const fields = parseFrontmatter(s.source)
      if (fields === null) return [`${s.label} (no frontmatter block)`]
      const absent = ['name', 'description'].filter((key) => !fields[key])
      return absent.length === 0
        ? []
        : [`${s.label} (missing: ${absent.join(', ')})`]
    })
    expect(
      incomplete,
      '\nA skill is selected on its frontmatter alone. Without a description' +
        '\nthe model has nothing to match the task against, so the skill is' +
        '\nnever chosen — and nothing anywhere reports that.'
    ).toEqual([])
  })

  it('names every skill after its own directory', () => {
    const mismatched = skills.flatMap((s) => {
      const name = s.source === null ? null : parseFrontmatter(s.source)?.name
      if (!name || name === s.dir) return []
      return [`${s.label} declares '${name}', directory says '${s.dir}'`]
    })
    expect(
      mismatched,
      "\nThe directory is the skill's address and the frontmatter is its name." +
        '\nWhen they disagree, `/<name>` and the file a reader opens are two' +
        '\ndifferent things.'
    ).toEqual([])
  })
})

describe('.claude/workflows agree with themselves', () => {
  it('parses every workflow as the async body the runtime will run', () => {
    const broken = workflows.flatMap((w) => {
      const error = parseErrorOf(w.source)
      return error === null ? [] : [`${w.label}: ${error}`]
    })
    expect(
      broken,
      '\nNothing else parses these files. `.claude/**` is out of scope for' +
        '\nBiome and for tsc, so a syntax error here survives a green `pnpm' +
        '\ngate` and surfaces only when someone invokes the workflow.'
    ).toEqual([])
  })

  it('exports a meta literal from every workflow', () => {
    const malformed = workflows.flatMap((w) => {
      const block = metaBlockOf(w.source)
      if (block === null) return [`${w.label} (no '${META_OPENS}…')`]
      const absent = ['name', 'description', 'phases'].filter(
        (key) => !new RegExp(`\\b${key}:`).test(block)
      )
      return absent.length === 0
        ? []
        : [`${w.label} (missing: ${absent.join(', ')})`]
    })
    expect(
      malformed,
      '\nThe runtime reads `meta` before running anything: no name, no' +
        '\ndescription in the permission dialog, no phases in the progress' +
        '\ntree. It must be the first thing in the file, and a pure literal.'
    ).toEqual([])
  })

  it('names every workflow after its own file', () => {
    const mismatched = workflows.flatMap((w) => {
      const block = metaBlockOf(w.source) ?? ''
      const declared = /name:\s*'([^']+)'/.exec(block)?.[1]
      const expected = w.name.replace(/\.js$/, '')
      if (!declared || declared === expected) return []
      return [`${w.label} declares '${declared}'`]
    })
    expect(
      mismatched,
      '\nA workflow is invoked by its meta.name, not by its path. When the two' +
        '\ndiverge, the name that works is the one nobody can see in the tree.'
    ).toEqual([])
  })

  it('declares every phase the body uses', () => {
    const undeclared = workflows.flatMap((w) => {
      const declared = new Set(
        capturesOf(metaBlockOf(w.source) ?? '', DECLARED_PHASE)
      )
      const used = new Set([
        ...capturesOf(w.source, STARTED_PHASE),
        ...capturesOf(w.source, ASSIGNED_PHASE)
      ])
      return [...used]
        .filter((title) => !declared.has(title))
        .map((title) => `${w.label} uses '${title}'`)
    })
    expect(
      undeclared,
      '\nThe runtime matches phase titles EXACTLY against meta.phases. A title' +
        '\nthe body uses but meta never declares still runs — it just opens an' +
        '\nunnamed progress group, so the run reports a shape nobody designed.' +
        '\nAdd the entry to meta.phases, or fix the typo.'
    ).toEqual([])
  })
})

describe('.claude points at things that exist', () => {
  const scripts = Object.keys(
    JSON.parse(read(join(ROOT, 'package.json'))).scripts ?? {}
  )

  it('names only pnpm scripts this repo defines', () => {
    const unknown = assets.flatMap((asset) =>
      [...new Set(capturesOf(asset.source, QUOTED_PNPM))]
        .filter((script) => !scripts.includes(script))
        .map((script) => `${asset.label}: \`pnpm ${script}\``)
    )
    expect(
      unknown,
      '\nA skill that names a script which no longer exists sends its reader to' +
        '\na command-not-found — and the method is exactly the part nobody' +
        '\ndouble-checks, because it is the part that tells you what to check.' +
        `\nDefined: ${scripts.join(', ')}`
    ).toEqual([])
  })

  it('sends workflows only to paths that exist', () => {
    const broken = workflows.flatMap((w) =>
      [...new Set(capturesOf(w.source, ROOTED_PATH))]
        .map((path) => path.replace(/[.,;:]+$/, ''))
        .filter((path) => !existsSync(resolve(ROOT, path)))
        .map((path) => `${w.label} → ${path}`)
    )
    expect(
      broken,
      '\nA workflow prompt is a reading list: it tells the agent which files to' +
        '\nread before it is allowed to judge. A path that moved does not fail —' +
        '\nthe agent simply reviews without the ADR that would have refuted it,' +
        '\nand reports a finding the constraint already answered.'
    ).toEqual([])
  })
})
