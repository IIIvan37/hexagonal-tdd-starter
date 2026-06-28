// Public contract of the core (the only surface adapters consume).

export type { GreetDeps, GreetResult } from './application/greet.ts'
export { greet } from './application/greet.ts'
export type { GreetingSink, NameSource } from './application/ports.ts'
export type { Greeting } from './domain/greeting.ts'
export { buildGreeting } from './domain/greeting.ts'
