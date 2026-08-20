import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Fitness function for the project-state docs.
 *
 * `docs/STATUS.md` describes the PRESENT: where we are, and the single next
 * action. Left to good intentions it turns into an append-only log — a roadmap
 * row per step, a journal line per session, every resolved decision — and by the
 * time it is 300 lines nobody reads the three lines that matter. That is not a
 * hypothetical: it happened on a real project built from this starter.
 *
 * Anything that only accumulates is derivable elsewhere and does not belong
 * here: the session list is `ls docs/sessions/`, the history is `git log`, the
 * durable decisions are `docs/adr/` (indexed by subject, so bounded by the
 * number of topics rather than the number of commits).
 *
 * These bounds are deliberately mechanical. Discipline is what already failed.
 */

const DOCS = fileURLToPath(new URL('.', import.meta.url))

/** Long enough for the present state, too short for a log. */
const STATUS_MAX_LINES = 60

/** Reports kept in the working set; older ones move to sessions/archive/. */
const ACTIVE_SESSIONS_MAX = 5

/** Active root documents (STATUS, live plans, runbooks); finished plans move
 * to archive/. */
const ACTIVE_ROOT_DOCS_MAX = 8

const linesOf = (path: string) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')

const markdownIn = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)

describe('docs/STATUS.md stays a snapshot, not a log', () => {
  const status = `${DOCS}STATUS.md`

  it(`is at most ${STATUS_MAX_LINES} non-blank lines`, () => {
    const lines = linesOf(status)
    expect(
      lines.length,
      `\nSTATUS.md has ${lines.length} non-blank lines (max ${STATUS_MAX_LINES}).` +
        '\nIt describes the PRESENT. Move history to docs/sessions/, durable' +
        '\ndecisions to docs/adr/, and collapse finished roadmap rows.'
    ).toBeLessThanOrEqual(STATUS_MAX_LINES)
  })

  it('does not index the session reports (the directory already does)', () => {
    const text = readFileSync(status, 'utf8')
    const sessionLinks = text.match(/sessions\/\d{4}-\d{2}-\d{2}/g) ?? []
    expect(
      sessionLinks,
      '\nSTATUS.md links individual session reports, which grows by one line per' +
        '\nsession. Link the docs/sessions/ directory instead.'
    ).toEqual([])
  })
})

describe('docs root stays scannable', () => {
  it(`keeps at most ${ACTIVE_ROOT_DOCS_MAX} active documents`, () => {
    const active = markdownIn(DOCS)
    expect(
      active.length,
      `\ndocs/ holds ${active.length} root documents (max ${ACTIVE_ROOT_DOCS_MAX}).` +
        '\nA finished plan is not deleted, it is archived: git mv it to' +
        '\ndocs/archive/ — readable forever, out of the working set.'
    ).toBeLessThanOrEqual(ACTIVE_ROOT_DOCS_MAX)
  })
})

describe('docs/sessions stays a rolling window', () => {
  const sessions = `${DOCS}sessions`

  it(`keeps at most ${ACTIVE_SESSIONS_MAX} active reports`, () => {
    const active = markdownIn(sessions).filter((n) => n !== '_TEMPLATE.md')
    expect(
      active.length,
      `\ndocs/sessions/ holds ${active.length} reports (max ${ACTIVE_SESSIONS_MAX}).` +
        '\nMove the oldest to docs/sessions/archive/ — they stay readable, just' +
        '\nout of the working set.'
    ).toBeLessThanOrEqual(ACTIVE_SESSIONS_MAX)
  })

  it('names reports so the oldest is obvious at a glance', () => {
    const active = markdownIn(sessions).filter((n) => n !== '_TEMPLATE.md')
    for (const name of active) {
      expect(name, `${name} should be <YYYY-MM-DD>-<slug>.md`).toMatch(
        /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/
      )
    }
  })
})

/*
 * Path truth: the LIVING docs (README, CLAUDE.md, CONTRIBUTING, skills,
 * STATUS, the in-tree registry READMEs) may only name files that exist. The
 * method is described on several surfaces on purpose — each has a different
 * reader — and prose is exactly the redundancy no compiler checks: after the
 * greet extraction, three of them still pointed at pre-move paths. Dated
 * documents (session reports, ADR bodies) are exempt: they describe a past
 * that was true when written.
 */

const ROOT = resolve(DOCS, '..')

/** Safe-charset, ≥ 2 segments: no placeholders (<, {), globs (*), specifiers (@, :). */
const PATH_SHAPED = /^[\w.-]+(?:\/[\w.-]+)+\/?$/

/** First segments that promise "this is a repo path", even without a dot. */
const KNOWN_ROOTS = new Set([
  'packages',
  'docs',
  'scripts',
  '.claude',
  '.github'
])

/**
 * A path-shaped mention is CHECKED when it commits to being a path: it has a
 * file extension, a trailing slash, or a known top-level root. Bare two-word
 * fractions (`try/catch`), branch names (`feat/…`) stay prose.
 */
function isCheckablePath(candidate: string): boolean {
  if (!PATH_SHAPED.test(candidate)) {
    return false
  }
  if (candidate.endsWith('/')) {
    return true
  }
  const segments = candidate.split('/')
  const last = segments[segments.length - 1] ?? ''
  return last.includes('.') || KNOWN_ROOTS.has(segments[0] ?? '')
}

/** Inline-code spans and markdown link targets that look like repo paths. */
function pathCandidatesOf(markdown: string): readonly string[] {
  const blanked = markdown.replace(/```[\s\S]*?```/g, ' ')
  const spans = [...blanked.matchAll(/`([^`\n]+)`/g)].map((m) => m[1] ?? '')
  const links = [...blanked.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1] ?? '')
  return [...spans, ...links].filter(isCheckablePath)
}

/** Ancestor directories of a file list, in posix form (any separator in). */
function ancestorDirsOf(files: readonly string[]): readonly string[] {
  return [
    ...new Set(
      files.flatMap((file) => {
        const parts = file.split(/[\\/]/).slice(0, -1)
        return parts.map((_, i) => parts.slice(0, i + 1).join('/'))
      })
    )
  ]
}

/** Every repo path (files and directories), relative to the root, in posix form. */
function repoPaths(): readonly string[] {
  const skip = new Set(['node_modules', '.git', 'reports', 'coverage'])
  const files: string[] = []
  const walkDir = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!skip.has(entry.name)) {
          walkDir(path)
        }
      } else {
        files.push(relative(ROOT, path).replaceAll('\\', '/'))
      }
    }
  }
  walkDir(ROOT)
  return [...new Set([...files, ...ancestorDirsOf(files)])]
}

/** True when `candidate` exists — relative to the doc, the root, or as a suffix. */
function resolvesInRepo(
  candidate: string,
  docDir: string,
  paths: readonly string[]
): boolean {
  const clean = candidate.replace(/\/$/, '')
  if (existsSync(resolve(docDir, clean)) || existsSync(resolve(ROOT, clean))) {
    return true
  }
  // The Windows CI leg walks backslash paths; doc mentions use slashes.
  return paths.some((p) => {
    const posix = p.replaceAll('\\', '/')
    return posix === clean || posix.endsWith(`/${clean}`)
  })
}

/** The living docs: everything that claims to describe the present. */
function livingDocs(): readonly string[] {
  const skillsDir = join(ROOT, '.claude/skills')
  const skills = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => `.claude/skills/${e.name}/SKILL.md`)
  const registries = [
    'packages/core/src/application/README.md',
    'packages/core/src/domain/README.md'
  ]
  return [
    'README.md',
    'CLAUDE.md',
    'CONTRIBUTING.md',
    'docs/STATUS.md',
    'docs/ARCHITECTURE.md',
    'docs/adr/README.md',
    'docs/agents/domain.md',
    ...skills,
    ...registries
  ].filter((doc) => existsSync(join(ROOT, doc)))
}

describe('the path detector itself', () => {
  it.each([
    'packages/core/src/index.ts',
    'cli/src/report.ts',
    'docs/sessions/',
    'packages/core',
    '../shared/'
  ])('checks %j', (candidate) => {
    expect(isCheckablePath(candidate)).toBe(true)
  })

  it.each([
    'try/catch',
    'feat/emergent-modules',
    '@app/core/testing',
    'node:fs',
    'core/src/<feature>/domain',
    '*.spec.ts',
    'https://example.com/page',
    'red-green-refactor'
  ])('leaves %j to prose', (candidate) => {
    expect(isCheckablePath(candidate)).toBe(false)
  })

  it('reads inline code and link targets, not fenced blocks', () => {
    const markdown = [
      'See `packages/core/src/index.ts` and [the ADR](docs/adr/README.md).',
      '```',
      'packages/inside/a-fence.ts',
      '```'
    ].join('\n')
    expect(pathCandidatesOf(markdown)).toEqual([
      'packages/core/src/index.ts',
      'docs/adr/README.md'
    ])
  })

  it('resolves doc-relative, root-relative and suffix mentions', () => {
    const paths = repoPaths()
    expect(resolvesInRepo('packages/cli/src/report.ts', ROOT, paths)).toBe(true)
    expect(resolvesInRepo('cli/src/report.ts', ROOT, paths)).toBe(true)
    expect(
      resolvesInRepo(
        '../shared/',
        join(ROOT, 'packages/core/src/domain'),
        paths
      )
    ).toBe(true)
    expect(resolvesInRepo('no-such/no-file.ts', ROOT, paths)).toBe(false)
  })

  it('matches suffixes across Windows separators too', () => {
    // On the Windows CI leg, repoPaths() yields backslash-separated paths;
    // doc mentions always use forward slashes. Its first run proved the
    // comparison must bridge the two.
    expect(
      resolvesInRepo('cli/src/report.ts', ROOT, [
        'packages\\cli\\src\\report.ts'
      ])
    ).toBe(true)
  })

  it('derives ancestor directories across Windows separators too', () => {
    // Second Windows lesson: directories are derived from the file list by
    // splitting on the separator — split on '/' alone and the Windows leg
    // has no directories at all, so every `dir/` mention reads as broken.
    expect(ancestorDirsOf(['docs\\sessions\\archive\\README.md'])).toEqual([
      'docs',
      'docs/sessions',
      'docs/sessions/archive'
    ])
  })
})

describe('living docs name only paths that exist', () => {
  const paths = repoPaths()

  it.each(livingDocs())('%s', (doc) => {
    const markdown = readFileSync(join(ROOT, doc), 'utf8')
    const docDir = dirname(join(ROOT, doc))
    const broken = pathCandidatesOf(markdown).filter(
      (candidate) => !resolvesInRepo(candidate, docDir, paths)
    )
    expect(
      broken,
      `\n${doc} names paths that do not exist: ${broken.join(', ')}.` +
        '\nThe doc drifted from the tree — fix the mention (or the tree).' +
        '\nHypothetical examples must not look like real paths; dated docs' +
        '\n(sessions, ADR bodies) are exempt by design.'
    ).toEqual([])
  })
})
