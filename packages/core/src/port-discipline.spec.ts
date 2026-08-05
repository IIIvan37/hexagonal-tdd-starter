import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Design fitness function for PORT SHAPE (ISP). An optional method in a
 * port interface is an interface admitting it is several — the consumer
 * that needs the capability and the one that does not are two consumers,
 * and the `?` makes every adapter carry the question. Declare separate,
 * consumer-shaped ports instead.
 *
 * Ratchet: the count of optional CALLABLE members across the core's
 * `ports.ts` files is pinned and only ever descends. Optional data fields
 * (`signal?: AbortSignal`, `artist?: string`) are value shape, not
 * interface identity — they stay out of scope.
 */

// ── Ratchet — LOWER as ports are split, NEVER raise. ────────────────────────
const OPTIONAL_MEMBERS_PIN = 0

const OPTIONAL_METHOD = /^\s*(?:readonly\s+)?[\w$]+\?\s*\(/
const OPTIONAL_FN_PROP = /^\s*(?:readonly\s+)?[\w$]+\?\s*:\s*\(.*=>/

function portFiles(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '.stryker-tmp' ? [] : portFiles(path)
    }
    return entry.name === 'ports.ts' ? [path] : []
  })
}

interface Finding {
  readonly path: string
  readonly line: number
  readonly text: string
}

function optionalMembers(source: string, path: string): readonly Finding[] {
  return source
    .split('\n')
    .flatMap((text, index) =>
      (OPTIONAL_METHOD.test(text) || OPTIONAL_FN_PROP.test(text)) &&
      !/^\s*(\/\/|\*|\/\*)/.test(text)
        ? [{ path, line: index + 1, text: text.trim() }]
        : []
    )
}

const coreRoot = fileURLToPath(new URL('.', import.meta.url))

describe('the detector itself', () => {
  it.each([
    'spectrum?(): Frame | undefined',
    '  readonly onProgress?: (fraction: number) => void'
  ])('flags the optional member %j', (source) => {
    expect(optionalMembers(source, 'x.ts')).toHaveLength(1)
  })

  it.each([
    'readonly spectrum: () => Frame',
    'load(items: Items): void',
    '  signal?: AbortSignal',
    '  readonly artist?: string',
    'const maybe = flag ? a : b'
  ])('leaves %j alone (required, data field, expression)', (source) => {
    expect(optionalMembers(source, 'x.ts')).toEqual([])
  })
})

describe('port discipline over the core ports', () => {
  const files = portFiles(coreRoot)

  it('finds ports.ts files to scan (a silent empty scan proves nothing)', () => {
    expect(files.length).toBeGreaterThanOrEqual(1)
  })

  it('never grows an optional member in a port interface', () => {
    const found = files.flatMap((path) =>
      optionalMembers(readFileSync(path, 'utf8'), path)
    )
    const listing = found
      .map(({ path, line, text }) => `  ${path}:${line} — ${text}`)
      .join('\n')
    expect(
      found.length,
      `\noptional port members: ${found.length}, pin ${OPTIONAL_MEMBERS_PIN}.` +
        `\nAbove the pin: an optional method is an interface admitting it is` +
        `\nseveral — declare a separate consumer-shaped port instead.` +
        `\nBelow the pin: ratchet OPTIONAL_MEMBERS_PIN down in this PR.\n${listing}`
    ).toBe(OPTIONAL_MEMBERS_PIN)
  })
})
