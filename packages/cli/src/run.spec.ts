import { afterEach, describe, expect, it, vi } from 'vitest'
import { run } from './run.ts'

/**
 * Acceptance test of the vertical slice, in process: it drives the composition
 * root through its real adapters — only the process boundary (stdout/stderr) is
 * doubled. This is the test that comes FIRST when you add a feature
 * (`/new-feature-hexa`); it is what pulls the domain into existence.
 *
 * Its sibling `main.spec.ts` runs the same slice as a real subprocess: slower,
 * uninstrumented, but the only proof the shipped binary starts at all.
 */
/**
 * The composition root wires the REAL `SystemClock`, so which salutation comes
 * out depends on when the suite runs. That is deliberate: this altitude proves
 * the slice is wired, not what the domain decides. Pinning the time belongs to
 * `greet.spec.ts`, where a `FixedClock` is injected — which is the whole reason
 * the clock is a port.
 */
const GREETING_TO_ADA = /^Good (morning|afternoon|evening), Ada!$/

function captureOutput() {
  const out: string[] = []
  const err: string[] = []
  vi.spyOn(console, 'log').mockImplementation((line: string) => {
    out.push(line)
  })
  vi.spyOn(console, 'error').mockImplementation((line: string) => {
    err.push(line)
  })
  return { out, err }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('greet <name> — the CLI slice, end to end', () => {
  it('prints the greeting and reports success', async () => {
    const { out } = captureOutput()

    const code = await run(['Ada'])

    expect(code).toBe(0)
    expect(out).toEqual([expect.stringMatching(GREETING_TO_ADA)])
  })

  it('trims the name on the way through the domain', async () => {
    const { out } = captureOutput()

    await run(['  Ada  '])

    expect(out).toEqual([expect.stringMatching(GREETING_TO_ADA)])
  })

  it('rejects a missing name with a usage message', async () => {
    const { out, err } = captureOutput()

    const code = await run([])

    expect(code).toBe(2)
    expect(out).toEqual([])
    expect(err).toEqual(['usage: greet <name>'])
  })

  it('words the domain error itself, and exits on misuse', async () => {
    const { out, err } = captureOutput()

    const code = await run(['   '])

    // The core reported `{ kind: 'empty-name' }`; the wording and the exit code
    // are this adapter's decision, which is exactly what tagging errors buys.
    expect(code).toBe(2)
    expect(out).toEqual([])
    expect(err).toEqual(['✖ a name is required'])
  })

  it('survives a broken stdout and reports it as unavailability', async () => {
    const errors: string[] = []
    // A closed pipe (`greet Ada | head -0`) is the realistic version of this.
    vi.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('EPIPE')
    })
    vi.spyOn(console, 'error').mockImplementation((line: string) => {
      errors.push(line)
    })

    const code = await run(['Ada'])

    expect(code).toBe(69)
    expect(errors).toEqual(['✖ could not emit the greeting: EPIPE'])
  })
})
