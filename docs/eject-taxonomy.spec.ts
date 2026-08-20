import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  DELETE_MARKER,
  markedFiles,
  REWRITE_MARKER,
  STUBS
} from '../scripts/eject-taxonomy.ts'

/**
 * Design fitness function for THE EJECT TAXONOMY, both directions.
 *
 * "Which files are skeleton" is declared twice: in-band, as a first-line marker
 * the README advertises as "the full list, always current", and out-of-band, as
 * the STUBS map keyed by literal path. The script honoured one direction — it
 * warned when a STUBS key carried no marker — and was silent on the other, so a
 * new SKELETON ROLE file that nobody added to STUBS ships greet-flavoured
 * content into a fresh project and still typechecks.
 *
 * Harvested from finding 2 of docs/reviews/2026-08-20-depth-review.md, whose
 * evidence was three past drifts (01e03a4, 5fee495, a523b40) — the last caught
 * by a human review rather than by a check. The general rule outlives this
 * repo: a template that marks files in-band AND lists them out-of-band must
 * assert both directions, or the two representations agree only by coincidence.
 *
 * It lives in docs/ because vitest.config.ts includes only packages/*​/src/**
 * and docs/** — a scripts/eject-example.spec.ts would never run.
 *
 * It has ONE licensed way to say nothing: an already-ejected project, where no
 * DELETE-marked file remains and the taxonomy has nothing left to describe.
 * That is a state, not a pass — the suite skips rather than asserting on an
 * empty set, the way fake-fidelity.spec.ts skips a scan that found no sources.
 * Verified by running `pnpm eject:example` for real: without this guard the
 * ejected skeleton is RED, which is the very class of bug a523b40 fixed.
 */

/** Is the example still here? If not, the taxonomy describes nothing. */
const exampleIsPresent = markedFiles(DELETE_MARKER).length > 0

describe.skipIf(!exampleIsPresent)(
  'the eject taxonomy agrees with itself',
  () => {
    const marked = markedFiles(REWRITE_MARKER)
    const listed = Object.keys(STUBS)

    it('finds marked files to scan (a silent empty scan proves nothing)', () => {
      expect(marked.length).toBeGreaterThan(0)
      expect(listed.length).toBeGreaterThan(0)
    })

    it('gives every SKELETON ROLE file a stub', () => {
      const unlisted = marked.filter((path) => !listed.includes(path))
      expect(
        unlisted,
        '\nThese files are marked "EXAMPLE CONTENT, SKELETON ROLE" but no STUBS' +
          '\nentry replaces them, so `pnpm eject:example` leaves the greet example' +
          '\nin a scaffolded project — and it still typechecks, so nothing says so.' +
          '\nAdd a stub in scripts/eject-taxonomy.ts, or change the marker.'
      ).toEqual([])
    })

    it('gives every stub a file that still carries the marker', () => {
      const stale = listed.filter((path) => !marked.includes(path))
      expect(
        stale,
        '\nSTUBS names files that are not marked "EXAMPLE CONTENT, SKELETON ROLE"' +
          '\n— they moved, were renamed, or lost their marker. The eject would' +
          '\noverwrite them anyway, or crash reading one that no longer exists.'
      ).toEqual([])
    })

    it('names files that exist', () => {
      const missing = listed.filter((path) => !existsSync(path))
      expect(missing, '\nSTUBS keys must be real paths.').toEqual([])
    })

    it('keeps the two markers disjoint', () => {
      const both = markedFiles(DELETE_MARKER).filter((path) =>
        marked.includes(path)
      )
      expect(both, '\nA file cannot be both deleted and stubbed.').toEqual([])
    })
  }
)
