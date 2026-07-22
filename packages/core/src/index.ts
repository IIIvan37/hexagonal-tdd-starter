// EXAMPLE CONTENT, SKELETON ROLE — keep this file, rewrite its contents for your slice. See README "Anatomy".
// Public contract of the core (the only surface adapters consume).

export type {
  GreetDeps,
  GreetError,
  GreetResult
} from './application/greet.ts'
export { greet } from './application/greet.ts'
export type { Clock, GreetingSink, NameSource } from './application/ports.ts'
export type { Greeting, GreetingError } from './domain/greeting.ts'
export { buildGreeting } from './domain/greeting.ts'
// Exported because `SystemClock` (cli adapter) must build one. `hourOfDay` and
// `salutationFor` stay internal: no adapter consumes them, the use-case does.
export type { Instant } from './domain/instant.ts'
export type { Result } from './domain/result.ts'
