import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

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
const ASYNC_METHOD = /^\s*(?:public\s+)?async\s+([\w$]+)\s*\(/

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
    const name = declaration?.[1]
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
 * Bodies of the classes in `source` that implement `port`. Scoping to the class
 * matters: one testing file holds every fake of a feature, so scanning the whole
 * file would blame one port for another's methods.
 */
export function bodiesImplementing(
  source: string,
  port: string
): readonly string[] {
  const declaration = new RegExp(
    `^\\s*(?:export\\s+)?class\\s+[\\w$]+[^{]*\\bimplements\\b[^{]*\\b${port}\\b`
  )
  const lines = source.split('\n')
  const bodies: string[] = []
  for (const [index, line] of lines.entries()) {
    if (!declaration.test(line)) {
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
    bodies.push(body)
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

function walk(dir: string, keep: (name: string) => boolean): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '.stryker-tmp' ? [] : walk(path, keep)
    }
    return keep(entry.name) ? [path] : []
  })
}

function packageRoots(): readonly string[] {
  const packages = fileURLToPath(new URL('../..', import.meta.url))
  return readdirSync(packages, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packages, entry.name, 'src'))
    .filter((src) => existsSync(src))
}

const normalized = (path: string): string => path.replaceAll('\\', '/')
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

  it('stays dormant at one adapter, and wakes at two', () => {
    expect(realSeams(['Store'], () => 1)).toEqual([])
    expect(realSeams(['Store'], () => 2)).toEqual(['Store'])
  })
})

describe('async fakes model the delay, once the seam is real', () => {
  const roots = packageRoots()
  const sources = roots.flatMap((root) =>
    walk(root, (name) => /\.tsx?$/.test(name))
  )
  const production = sources.filter(
    (path) => !isTestKit(path) && !/\.spec\.tsx?$/.test(path)
  )

  const asyncPorts = sources
    .filter((path) => path.endsWith('ports.ts'))
    .flatMap((path) => asyncPortsOf(readFileSync(path, 'utf8')))

  const realAdapters = (port: string): readonly string[] =>
    production.filter((path) =>
      new RegExp(`implements\\s+[^{]*\\b${port}\\b`).test(
        readFileSync(path, 'utf8')
      )
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
