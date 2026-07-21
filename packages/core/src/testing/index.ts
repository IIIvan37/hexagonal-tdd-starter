// EXAMPLE CONTENT, SKELETON ROLE — keep this file, rewrite its contents for your slice. See README "Anatomy".
// Test-support surface of the core, consumed by adapters through `@app/core/testing`.
// Kept out of `src/index.ts` on purpose: production code must not be able to
// import a fake, and this module is the only place allowed to depend on vitest.

export {
  FailingNameSource,
  FixedClock,
  InMemoryGreetingSink,
  InMemoryNameSource
} from './in-memory-adapters.ts'
export type {
  ClockSubject,
  GreetingSinkSubject,
  NameSourceSubject
} from './port-contracts.ts'
export {
  clockContract,
  greetingSinkContract,
  nameSourceContract
} from './port-contracts.ts'
