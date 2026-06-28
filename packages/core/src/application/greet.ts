import { buildGreeting } from '../domain/greeting.ts'
import type { GreetingSink, NameSource } from './ports.ts'

export interface GreetDeps {
  readonly source: NameSource
  readonly sink: GreetingSink
}

export type GreetResult =
  | { readonly ok: true; readonly recipient: string }
  | { readonly ok: false; readonly error: string }

/**
 * Orchestration use-case, pure: load via the source port, build the greeting in
 * the domain, emit via the sink port. No I/O here — everything arrives through
 * `deps`. Expected failures are a `Result`, not an exception.
 */
export async function greet(deps: GreetDeps): Promise<GreetResult> {
  try {
    const name = await deps.source.load()
    const greeting = buildGreeting(name)
    await deps.sink.save(greeting)
    return { ok: true, recipient: greeting.recipient }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
