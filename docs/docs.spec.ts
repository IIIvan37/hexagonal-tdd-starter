import { readdirSync, readFileSync } from 'node:fs'
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
