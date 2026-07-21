import { greet } from '@app/core'
import { ArgvNameSource } from './adapters/argv-name-source.ts'
import { ConsoleGreetingSink } from './adapters/console-greeting-sink.ts'
import { SystemClock } from './adapters/system-clock.ts'

/**
 * Composition root: parse argv, inject the real ports into the use-case, map the
 * Result to an exit code. No business logic here.
 *
 * Kept separate from `main.ts` so the whole slice stays testable in process —
 * `main.ts` owns only the process boundary (`process.exit`), which a test cannot
 * cross. Return the exit code, never call `process.exit` from here.
 */
export async function run(argv: readonly string[]): Promise<number> {
  const name = argv[0]
  if (name === undefined) {
    console.error('usage: greet <name>')
    return 2
  }

  const result = await greet({
    source: new ArgvNameSource(name),
    sink: new ConsoleGreetingSink(),
    clock: new SystemClock()
  })

  if (!result.ok) {
    console.error(`✖ ${result.error}`)
    return 1
  }
  return 0
}
