import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { filesUnder } from '../../../scripts/source-tree.ts'

/**
 * Design fitness function for THE APPLICATION REGISTRY. The registry
 * (`application/README.md`) is the single place `/new-feature-hexa` says to
 * look before adding a feature, so ports get reused instead of reinvented. It
 * is hand-written prose, and prose about a tree drifts: in the field project it
 * ended up advertising three ports that had been deleted — three seams a reader
 * would have believed real, from the very table meant to prove substitutability.
 *
 * Both directions are checked, because they fail differently:
 *
 * 1. **A row with no port.** What bit the field project — the table outlives
 *    the code, and the reuse it promises is a fiction.
 * 2. **A port with no row.** The likelier one in daily work — the port exists,
 *    nobody registers it, and the next feature reinvents it. The registry that
 *    is only 90 % complete is the registry nobody trusts.
 *
 * Strict coherence, which is what makes the ejected skeleton honest: an empty
 * registry is legal only when the tree has no ports, and a tree with ports
 * forces rows. Neither case needs its own assertion — it falls out of the two.
 *
 * A port is an interface exported from an `application/ports.ts`; a contract is
 * a `…Contract` exported from a `testing/` file. The `Implemented by` column
 * stays free prose (it names classes across packages) and the use-case table
 * stays out of scope — a use-case has no mechanical signature to key on.
 */

const CORE = fileURLToPath(new URL('.', import.meta.url))
const REGISTRY = join(CORE, 'application', 'README.md')

/** An empty table still needs a row; this is the one that means "none". */
const EMPTY_ROW = /_\(none yet\)_/

const EXPORTED_INTERFACE = /^export interface ([A-Za-z_$][\w$]*)/gm
const EXPORTED_CONTRACT =
  /^export (?:function|const) ([A-Za-z_$][\w$]*Contract)\b/gm

const portFiles = (): readonly string[] =>
  filesUnder(
    CORE,
    (path, name) => name === 'ports.ts' && path.includes('application')
  )

const contractFiles = (): readonly string[] =>
  filesUnder(
    CORE,
    (path, name) =>
      path.includes(`${'testing'}`) &&
      name.endsWith('.ts') &&
      !name.endsWith('.spec.ts')
  )

function namesMatching(source: string, pattern: RegExp): readonly string[] {
  return [...source.matchAll(pattern)].map((match) => match[1] ?? '')
}

interface Row {
  readonly port: string
  readonly contract: string
}

/** The `## Ports` table, as rows. Header, separator and `_(none yet)_` drop out. */
export function portRows(markdown: string): readonly Row[] {
  const section = markdown.split(/^## Ports\s*$/m)[1] ?? ''
  return section
    .split('\n')
    .filter((line) => line.startsWith('|') && !EMPTY_ROW.test(line))
    .flatMap((line) => {
      const cells = line.split('|').map((cell) => cell.trim())
      const [, port = '', , contract = ''] = cells
      const named = /^`([^`]+)`$/
      const portName = named.exec(port)?.[1]
      return portName === undefined
        ? []
        : [{ port: portName, contract: named.exec(contract)?.[1] ?? '' }]
    })
}

describe('the detectors themselves', () => {
  const table = [
    '## Ports',
    '',
    '| Port | Kind | Contract | Implemented by |',
    '|------|------|----------|----------------|',
    '| `NameSource` | driving | `nameSourceContract` | `cli`: `ArgvNameSource` |',
    '',
    'Trailing prose that is not a row.'
  ].join('\n')

  it('reads a port row, dropping header, separator and prose', () => {
    expect(portRows(table)).toEqual([
      { port: 'NameSource', contract: 'nameSourceContract' }
    ])
  })

  it('reads an emptied registry as no rows', () => {
    expect(
      portRows('## Ports\n\n| Port |\n|---|\n| _(none yet)_ | | | |\n')
    ).toEqual([])
  })

  it('ignores a table that is not the ports table', () => {
    expect(portRows('## Use-cases\n\n| `greet` | x |\n')).toEqual([])
  })

  it('reads exported interfaces and contracts, not local ones', () => {
    expect(
      namesMatching(
        'export interface Clock {\ninterface Hidden {\n',
        EXPORTED_INTERFACE
      )
    ).toEqual(['Clock'])
    expect(
      namesMatching(
        'export function clockContract(\nexport function helper(\n',
        EXPORTED_CONTRACT
      )
    ).toEqual(['clockContract'])
  })
})

describe('the application registry describes the tree it sits in', () => {
  const registry = readFileSync(REGISTRY, 'utf8')
  const rows = portRows(registry)

  const declaredPorts = portFiles().flatMap((path) =>
    namesMatching(readFileSync(path, 'utf8'), EXPORTED_INTERFACE)
  )
  const declaredContracts = contractFiles().flatMap((path) =>
    namesMatching(readFileSync(path, 'utf8'), EXPORTED_CONTRACT)
  )

  it('finds the registry (a silent empty scan proves nothing)', () => {
    expect(registry).toMatch(/^## Ports\s*$/m)
  })

  it('registers every port the tree declares', () => {
    const missing = declaredPorts.filter(
      (port) => !rows.some((r) => r.port === port)
    )
    expect(
      missing,
      '\nports declared in an application/ports.ts with no row in' +
        '\npackages/core/src/application/README.md. An unregistered port is one' +
        '\nthe next feature reinvents — add its row in the same step.'
    ).toEqual([])
  })

  it('names no port the tree no longer declares', () => {
    const orphans = rows
      .map((r) => r.port)
      .filter((port) => !declaredPorts.includes(port))
    expect(
      orphans,
      '\nregistry rows naming a port that does not exist. This is the drift that' +
        '\nbit the field project: the table advertises seams that are gone, and a' +
        '\nreader reasons about substitutability from a fiction. Delete the row.'
    ).toEqual([])
  })

  it('names a real contract for every registered port', () => {
    const dangling = rows.filter((r) => !declaredContracts.includes(r.contract))
    expect(
      dangling,
      '\nregistry rows whose Contract column names no exported `…Contract`.' +
        '\nADR-0002: a port owns a contract, written in the same step as the port.'
    ).toEqual([])
  })
})
