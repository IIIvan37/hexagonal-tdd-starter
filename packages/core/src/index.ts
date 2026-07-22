// EXAMPLE CONTENT, SKELETON ROLE — keep this file, rewrite its contents for your slice. See README "Anatomy".
// Public contract of the core (the only surface adapters consume).

export type {
  GreetDeps,
  GreetError,
  GreetResult
} from './greet/application/greet.ts'
export { greet } from './greet/application/greet.ts'
export type {
  Clock,
  GreetingSink,
  NameSource
} from './greet/application/ports.ts'
// buildGreeting is NOT exported: no adapter consumes it (the use-case builds
// greetings internally). This spec-checked restraint is public-surface.spec.ts.
export type { Greeting, GreetingError } from './greet/domain/greeting.ts'
// Exported because `SystemClock` (cli adapter) must build one. `hourOfDay` and
// `salutationFor` stay internal: no adapter consumes them, the use-case does.
export type { Instant } from './greet/domain/instant.ts'
export type { Result } from './shared/result.ts'
