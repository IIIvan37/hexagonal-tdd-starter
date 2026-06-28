import type { Greeting } from '../domain/greeting.ts'

/** Driving port: provides the input. Implemented by an adapter (cli/web/…). */
export interface NameSource {
  load(): Promise<string>
}

/** Driven port: emits/persists the result. The concrete sink is the adapter's job. */
export interface GreetingSink {
  save(greeting: Greeting): Promise<void>
}
