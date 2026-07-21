import type { Greeting } from '../domain/greeting.ts'
import type { Instant } from '../domain/instant.ts'

/** Driving port: provides the input. Implemented by an adapter (cli/web/…). */
export interface NameSource {
  load(): Promise<string>
}

/** Driven port: emits/persists the result. The concrete sink is the adapter's job. */
export interface GreetingSink {
  save(greeting: Greeting): Promise<void>
}

/**
 * Driven port: reads the current time.
 *
 * The clock is the archetypal hidden dependency — `Date.now()` called deep in a
 * domain function makes it untestable and non-deterministic. Injecting it keeps
 * the core pure, and lets a test pin time to whatever it needs (`FixedClock`).
 *
 * It hands back an `Instant`, not a `Date`: resolving the machine's timezone is
 * environment-dependent, so the adapter does it once, at the boundary.
 */
export interface Clock {
  now(): Instant
}
