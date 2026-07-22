// EXAMPLE CONTENT, SKELETON ROLE — keep this file, rewrite its contents for your slice. See README "Anatomy".
import { greet } from '@app/core'
import { ArgvNameSource } from './adapters/argv-name-source.ts'
import { ConsoleGreetingSink } from './adapters/console-greeting-sink.ts'
import { SystemClock } from './adapters/system-clock.ts'
import { EXIT_MISUSE, EXIT_OK, report } from './report.ts'

/**
 * Composition root: parse argv, inject the real ports into the use-case, map the
 * Result to an exit code. No business logic here — wording and exit codes live
 * in `report.ts`.
 *
 * Kept separate from `main.ts` so the whole slice stays testable in process —
 * `main.ts` owns only the process boundary (`process.exit`), which a test cannot
 * cross. Return the exit code, never call `process.exit` from here.
 */
export async function run(argv: readonly string[]): Promise<number> {
  const name = argv[0]
  if (name === undefined) {
    console.error('usage: greet <name>')
    return EXIT_MISUSE
  }

  const result = await greet({
    source: new ArgvNameSource(name),
    sink: new ConsoleGreetingSink(),
    clock: new SystemClock()
  })

  if (!result.ok) {
    const { message, code } = report(result.error)
    console.error(`✖ ${message}`)
    return code
  }
  return EXIT_OK
}
