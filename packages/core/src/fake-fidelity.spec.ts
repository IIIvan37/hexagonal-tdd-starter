import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  filesUnder,
  normalized,
  packageRoots
} from '../../../scripts/source-tree.ts'

/**
 * Design fitness function for FAKE FIDELITY ON THE DIMENSION THAT MATTERS
 * (ADR-0008). ADR-0002 made substitutability testable; it did not make it
 * true. A contract asserts the settled value, so a reference fake that settles
 * instantly satisfies it while erasing the only dimension real adapters differ
 * on. In the field project four fakes of one port were all `async () => {}`,
 * and the bug they hid — playing while the graph was still connecting — was
 * unreachable from any test.
 *
 * Dormant by design. It fires only for an ASYNCHRONOUS port with TWO OR MORE
 * real adapters, because one adapter is a hypothetical seam and two is a real
 * one. Below that threshold a controllable fake is a supplier with no consumer,
 * which the outside-in invariant forbids — so on this repo's own `greet` the
 * detector is silent, and its mechanism is proven against fixtures instead.
 * A fitness function that can only ever pass is not evidence.
 *
 * A fake settles honestly when its body awaits something the test can drive.
 * An all-fail fake (`throw` on the error path) is exempt: it models a failure
 * mode, not a delay.
 */

/** One adapter is a hypothetical seam; two is a real one. */
const REAL_ADAPTERS_FOR_A_REAL_SEAM = 2

const EXPORTED_INTERFACE = /^export interface ([\w$]+)/
const PROMISE_RETURN = /:\s*Promise<|=>\s*Promise</
/** `async load(` on a class or object literal, and `load: async (` / `load = async (`
 * as a property — ADR-0008's own motivating evidence is written the second way. */
const ASYNC_METHOD =
  /^\s*(?:public\s+|readonly\s+)?(?:async\s+([\w$]+)\s*\(|([\w$]+)\s*[:=]\s*async\s*\()/

/** A line that opens a declaration whose block may implement a port. */
const DECLARATION =
  /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?(?:class|const|let|var|function|async\s+function)\b/

/** Exported interfaces of a `ports.ts` that promise a Promise. */
export function asyncPortsOf(source: string): readonly string[] {
  const ports: string[] = []
  let open: string | undefined
  let asynchronous = false
  for (const line of source.split('\n')) {
    const declaration = EXPORTED_INTERFACE.exec(line)
    if (declaration?.[1] !== undefined) {
      open = declaration[1]
      asynchronous = false
      continue
    }
    if (open === undefined) {
      continue
    }
    if (line === '}') {
      if (asynchronous) {
        ports.push(open)
      }
      open = undefined
      continue
    }
    asynchronous ||= PROMISE_RETURN.test(line)
  }
  return ports
}

/**
 * Async methods that settle unconditionally: no `await` for a test to drive,
 * no `throw` marking a deliberate failure fake.
 */
export function unconditionalSettlers(source: string): readonly string[] {
  const lines = source.split('\n')
  const found: string[] = []
  for (const [index, line] of lines.entries()) {
    const declaration = ASYNC_METHOD.exec(line)
    const name = declaration?.[1] ?? declaration?.[2]
    if (name === undefined) {
      continue
    }
    let depth = 0
    let body = ''
    for (const rest of lines.slice(index)) {
      depth += (rest.match(/{/g) ?? []).length - (rest.match(/}/g) ?? []).length
      body += `${rest}\n`
      if (depth <= 0 && body.includes('{')) {
        break
      }
    }
    if (!/\bawait\b/.test(body) && !/\bthrow\b/.test(body)) {
      found.push(name)
    }
  }
  return found
}

/**
 * Does this line name `port` in an IMPLEMENTATION position? The distinction the
 * detector turns on is "what counts as an implementation", not which keyword
 * happens to declare it: this codebase is idiomatic functional TypeScript, and
 * ADR-0008's own motivating fakes are object literals. A recognizer tied to
 * `implements` is blind to the evidence that motivated it — and a blind
 * detector is indistinguishable from a dormant one.
 */
export function implementsPort(source: string, port: string): boolean {
  const position = new RegExp(
    // class Http implements NameSource
    `\\bimplements\\b[^{]*\\b${port}\\b` +
      // const http: NameSource = { … }
      `|:\\s*${port}\\b\\s*=` +
      // function createStdin(): NameSource { … }
      `|\\)\\s*:\\s*${port}\\b` +
      // } satisfies NameSource
      `|\\bsatisfies\\s+${port}\\b`
  )
  return source.split('\n').some((line) => position.test(line))
}

/** The balanced block a declaration opens, or undefined if it opens none. */
function blockAt(
  lines: readonly string[],
  index: number
): { readonly body: string; readonly last: string } | undefined {
  let depth = 0
  let body = ''
  let last = ''
  for (const [offset, rest] of lines.slice(index).entries()) {
    // A declaration that ends before opening a brace is a value, not a block —
    // walking on would swallow the rest of the file.
    if (
      !body.includes('{') &&
      offset > 0 &&
      (rest.trim() === '' || DECLARATION.test(rest))
    ) {
      return undefined
    }
    depth += (rest.match(/{/g) ?? []).length - (rest.match(/}/g) ?? []).length
    body += `${rest}\n`
    last = rest
    if (depth <= 0 && body.includes('{')) {
      return { body, last }
    }
  }
  return undefined
}

/**
 * Bodies of the declarations in `source` that implement `port`, in any of the
 * idioms above. Scoping to the declaration matters: one testing file holds every
 * fake of a feature, so scanning the whole file would blame one port for
 * another's methods. The port is looked for on the block's opening line and on
 * its closing one, which is where `satisfies` lands.
 */
export function bodiesImplementing(
  source: string,
  port: string
): readonly string[] {
  const lines = source.split('\n')
  const bodies: string[] = []
  for (const [index, line] of lines.entries()) {
    if (!DECLARATION.test(line)) {
      continue
    }
    const block = blockAt(lines, index)
    if (block === undefined) {
      continue
    }
    if (implementsPort(line, port) || implementsPort(block.last, port)) {
      bodies.push(block.body)
    }
  }
  return bodies
}

/** The async ports whose seam is real, and whose fakes therefore answer for it. */
export function realSeams(
  asyncPorts: readonly string[],
  adapterCount: (port: string) => number
): readonly string[] {
  return asyncPorts.filter(
    (port) => adapterCount(port) >= REAL_ADAPTERS_FOR_A_REAL_SEAM
  )
}

const isTestKit = (path: string): boolean =>
  normalized(path).includes('/testing/')

describe('the detectors themselves', () => {
  it('sees a port asynchronous, and leaves a synchronous one alone', () => {
    expect(
      asyncPortsOf(
        [
          'export interface Store {',
          '  load(): Promise<string>',
          '}',
          'export interface Clock {',
          '  now(): Instant',
          '}'
        ].join('\n')
      )
    ).toEqual(['Store'])
  })

  it('flags an async method that settles with nothing to drive', () => {
    expect(
      unconditionalSettlers(
        '  async load(): Promise<string> {\n    return this.name\n  }'
      )
    ).toEqual(['load'])
  })

  it('leaves a fake that awaits something the test controls', () => {
    expect(
      unconditionalSettlers(
        '  async load(): Promise<string> {\n    await this.gate\n    return this.name\n  }'
      )
    ).toEqual([])
  })

  it('leaves an all-fail fake alone (a failure mode, not a delay)', () => {
    expect(
      unconditionalSettlers(
        '  async load(): Promise<string> {\n    throw new Error(this.reason)\n  }'
      )
    ).toEqual([])
  })

  it('scopes methods to the class implementing the port, not the whole file', () => {
    const kit = [
      'export class InMemoryStore implements Store {',
      '  async load(): Promise<string> {',
      '    return this.name',
      '  }',
      '}',
      'export class InMemorySink implements Sink {',
      '  async save(): Promise<void> {',
      '    this.rows.push(1)',
      '  }',
      '}'
    ].join('\n')
    expect(
      bodiesImplementing(kit, 'Store').flatMap(unconditionalSettlers)
    ).toEqual(['load'])
    expect(
      bodiesImplementing(kit, 'Sink').flatMap(unconditionalSettlers)
    ).toEqual(['save'])
  })

  it('recognises an implementation whatever syntax declares it', () => {
    // The idioms CLAUDE.md endorses, not just the one `greet` happens to use.
    expect(
      implementsPort('class Http implements NameSource {', 'NameSource')
    ).toBe(true)
    expect(
      implementsPort('export const http: NameSource = {', 'NameSource')
    ).toBe(true)
    expect(
      implementsPort('function createStdin(): NameSource {', 'NameSource')
    ).toBe(true)
    expect(implementsPort('} satisfies NameSource', 'NameSource')).toBe(true)
  })

  it('does not mistake a mention of the port for an implementation', () => {
    expect(
      implementsPort("import type { NameSource } from './ports'", 'NameSource')
    ).toBe(false)
    expect(implementsPort('export interface NameSource {', 'NameSource')).toBe(
      false
    )
    expect(
      implementsPort('class Http implements GreetingSink {', 'NameSource')
    ).toBe(false)
  })

  it('takes the body of a const-typed adapter, not only a class', () => {
    const kit = [
      'export const inMemoryStore: Store = {',
      '  async load(): Promise<string> {',
      '    return this.name',
      '  },',
      '}',
      'export const inMemorySink: Sink = {',
      '  async save(): Promise<void> {',
      '    this.rows.push(1)',
      '  },',
      '}'
    ].join('\n')
    expect(
      bodiesImplementing(kit, 'Store').flatMap(unconditionalSettlers)
    ).toEqual(['load'])
    expect(
      bodiesImplementing(kit, 'Sink').flatMap(unconditionalSettlers)
    ).toEqual(['save'])
  })

  it('takes the body of a factory that returns the port', () => {
    const kit = [
      'export function createStore(): Store {',
      '  return {',
      '    async load(): Promise<string> {',
      '      return name',
      '    },',
      '  }',
      '}'
    ].join('\n')
    expect(
      bodiesImplementing(kit, 'Store').flatMap(unconditionalSettlers)
    ).toEqual(['load'])
  })

  it('takes the body of an object closed by `satisfies`', () => {
    const kit = [
      'export const inMemoryStore = {',
      '  async load(): Promise<string> {',
      '    return name',
      '  },',
      '} satisfies Store'
    ].join('\n')
    expect(
      bodiesImplementing(kit, 'Store').flatMap(unconditionalSettlers)
    ).toEqual(['load'])
  })

  it('flags an arrow-property fake that settles with nothing to drive', () => {
    // ADR-0008's own motivating evidence is written this way.
    expect(
      unconditionalSettlers('  load: async () => {\n    return name\n  },')
    ).toEqual(['load'])
  })

  it('leaves an arrow-property fake that awaits something the test controls', () => {
    expect(
      unconditionalSettlers(
        '  load: async () => {\n    await gate\n    return name\n  },'
      )
    ).toEqual([])
  })

  it('fires end to end on the shape ADR-0008 was written from', () => {
    // The field-project fakes were `load: vi.fn(async () => {})` — an object
    // property, not a class method. The detector must catch its own evidence.
    const kit = [
      'export const fakeSource = {',
      '  load: async () => {',
      "    return 'ada'",
      '  },',
      '} satisfies NameSource'
    ].join('\n')
    const offenders = realSeams(['NameSource'], () => 2).flatMap((port) =>
      bodiesImplementing(kit, port).flatMap(unconditionalSettlers)
    )
    expect(offenders).toEqual(['load'])
  })

  it('stays dormant at one adapter, and wakes at two', () => {
    expect(realSeams(['Store'], () => 1)).toEqual([])
    expect(realSeams(['Store'], () => 2)).toEqual(['Store'])
  })
})

describe('async fakes model the delay, once the seam is real', () => {
  const roots = packageRoots()
  const sources = roots.flatMap((root) =>
    filesUnder(root, (_path, name) => /\.tsx?$/.test(name))
  )
  const production = sources.filter(
    (path) => !isTestKit(path) && !/\.spec\.tsx?$/.test(path)
  )

  const asyncPorts = sources
    .filter((path) => path.endsWith('ports.ts'))
    .flatMap((path) => asyncPortsOf(readFileSync(path, 'utf8')))

  const realAdapters = (port: string): readonly string[] =>
    production.filter((path) =>
      implementsPort(readFileSync(path, 'utf8'), port)
    )

  it('finds ports to scan (a silent empty scan proves nothing)', (context) => {
    if (sources.length === 0) {
      context.skip()
      return
    }
    expect(sources.length).toBeGreaterThan(0)
  })

  it('gives every fake of a real async seam a settlement a test can drive', () => {
    const offenders = realSeams(
      asyncPorts,
      (port) => realAdapters(port).length
    ).flatMap((port) =>
      sources
        .filter(isTestKit)
        .flatMap((path) =>
          bodiesImplementing(readFileSync(path, 'utf8'), port).flatMap((body) =>
            unconditionalSettlers(body).map(
              (method) =>
                `  ${path} — ${port}.${method}() settles unconditionally`
            )
          )
        )
    )
    expect(
      offenders,
      '\nADR-0008: this port has two real adapters, so its difficulty is WHEN it' +
        '\nsettles — and its fake resolves before a test can look. Give the fake a' +
        '\nsettlement the test drives (a deferred the spec resolves), and put one' +
        '\nin-flight assertion in the contract. An all-fail fake is exempt.'
    ).toEqual([])
  })
})
