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
    expect(out).toEqual(['Hello, Ada!'])
  })

  it('trims the name on the way through the domain', async () => {
    const { out } = captureOutput()

    await run(['  Ada  '])

    expect(out).toEqual(['Hello, Ada!'])
  })

  it('rejects a missing name with a usage message', async () => {
    const { out, err } = captureOutput()

    const code = await run([])

    expect(code).toBe(2)
    expect(out).toEqual([])
    expect(err).toEqual(['usage: greet <name>'])
  })

  it('surfaces a domain error without printing a greeting', async () => {
    const { out, err } = captureOutput()

    const code = await run(['   '])

    expect(code).toBe(1)
    expect(out).toEqual([])
    expect(err[0]).toContain('name must not be empty')
  })
})
