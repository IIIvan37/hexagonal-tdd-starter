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
 *
 * Second rule, same subject: a CEILING on how many callable members one port
 * may carry. The pin above catches the port that admits it is several; it says
 * nothing about the port that is simply too wide. In the field project's depth
 * review the worst offender had thirteen required members, eight of which its
 * only adapter forwarded verbatim — a sack of dependencies wearing a port's
 * name, and invisible to every check here. The ceiling is fixed, not ratcheted
 * to today's maximum: pinning it at what `greet` happens to need would make
 * every real project red on arrival, and the first reflex would be to raise the
 * bound — which is the one move this repo never allows.
 */

// ── Ratchet — LOWER as ports are split, NEVER raise. ────────────────────────
const OPTIONAL_MEMBERS_PIN = 0

/** Above this, the interface is a dependency sack, not a port. */
const MAX_PORT_MEMBERS = 6

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

/** Any callable member: method or function-typed property, optional or not. */
const CALLABLE_MEMBER = /^\s*(?:readonly\s+)?[\w$]+\??\s*(?:\(|:\s*\(.*=>)/

interface PortWidth {
  readonly port: string
  readonly members: number
}

/** Exported interfaces of one `ports.ts`, with their callable member count. */
function portWidths(source: string): readonly PortWidth[] {
  const lines = source.split('\n')
  const widths: PortWidth[] = []
  let open: string | undefined
  let members = 0
  for (const line of lines) {
    const declaration = /^export interface ([\w$]+)/.exec(line)
    if (declaration?.[1] !== undefined) {
      open = declaration[1]
      members = 0
      continue
    }
    if (open === undefined) {
      continue
    }
    if (line === '}') {
      widths.push({ port: open, members })
      open = undefined
      continue
    }
    if (CALLABLE_MEMBER.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) {
      members += 1
    }
  }
  return widths
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

describe('the width detector itself', () => {
  const source = [
    'export interface Wide {',
    '  a(): void',
    '  readonly b: (x: number) => void',
    '  c?(): void',
    '  // d(): void — a comment is not a member',
    '  data: string',
    '}',
    'interface NotExported {',
    '  e(): void',
    '}'
  ].join('\n')

  it('counts callable members of exported interfaces only', () => {
    expect(portWidths(source)).toEqual([{ port: 'Wide', members: 3 }])
  })

  it('reports each port of a multi-port file separately', () => {
    expect(
      portWidths(
        'export interface A {\n  x(): void\n}\nexport interface B {\n}'
      )
    ).toEqual([
      { port: 'A', members: 1 },
      { port: 'B', members: 0 }
    ])
  })
})

describe('port discipline over the core ports', () => {
  const files = portFiles(coreRoot)

  it('finds ports.ts files to scan (a silent empty scan proves nothing)', (context) => {
    if (files.length === 0) {
      context.skip()
      return
    }
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

  it(`keeps every port under ${MAX_PORT_MEMBERS} callable members`, () => {
    const wide = files.flatMap((path) =>
      portWidths(readFileSync(path, 'utf8'))
        .filter(({ members }) => members > MAX_PORT_MEMBERS)
        .map(({ port, members }) => `  ${path} — ${port}: ${members} members`)
    )
    expect(
      wide,
      `\nports above ${MAX_PORT_MEMBERS} callable members. Past that width an` +
        '\ninterface stops being a port and becomes a bag of dependencies: its' +
        '\nadapter forwards most members verbatim, and reading it costs more than' +
        '\nreading what it hides. Split it by consumer, or move the policy behind' +
        '\nit into the core and return a value the adapter executes.'
    ).toEqual([])
  })
})
