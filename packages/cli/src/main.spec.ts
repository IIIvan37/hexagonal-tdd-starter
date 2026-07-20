import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const mainPath = fileURLToPath(new URL('./main.ts', import.meta.url))

/**
 * The `bin` entry points at TypeScript sources, so the whole adapter graph must
 * stay within Node's *strip-only* subset (no parameter properties, enums,
 * namespaces or decorators) — otherwise `greet` is installable but unrunnable.
 * Running the real binary the way a user would is the only honest check.
 */
async function runCli(
  args: readonly string[]
): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      mainPath,
      ...args
    ])
    return { code: 0, stdout, stderr }
  } catch (e) {
    const failure = e as { code?: number; stdout?: string; stderr?: string }
    return {
      code: failure.code ?? 1,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? ''
    }
  }
}

describe('the CLI binary, run by plain node', () => {
  it('greets the given name and exits 0', async () => {
    const { code, stdout } = await runCli(['Ada'])
    expect(code).toBe(0)
    expect(stdout.trim()).toBe('Hello, Ada!')
  })

  it('prints usage and exits 2 when no name is given', async () => {
    const { code, stderr } = await runCli([])
    expect(code).toBe(2)
    expect(stderr).toContain('usage: greet <name>')
  })

  it('reports a domain error and exits 1', async () => {
    const { code, stderr } = await runCli(['   '])
    expect(code).toBe(1)
    expect(stderr).toContain('name must not be empty')
  })
})
