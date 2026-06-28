#!/usr/bin/env node
import { greet } from '@app/core'
import { ArgvNameSource } from './adapters/argv-name-source.ts'
import { ConsoleGreetingSink } from './adapters/console-greeting-sink.ts'

/**
 * Driving adapter / composition root: parse argv, inject the real ports into the
 * use-case, map the Result to an exit code. No business logic here.
 */
async function main(argv: readonly string[]): Promise<number> {
  const name = argv[0]
  if (name === undefined) {
    console.error('usage: greet <name>')
    return 2
  }

  const result = await greet({
    source: new ArgvNameSource(name),
    sink: new ConsoleGreetingSink()
  })

  if (!result.ok) {
    console.error(`✖ ${result.error}`)
    return 1
  }
  return 0
}

process.exit(await main(process.argv.slice(2)))
