// Test-support surface of the core, consumed by adapters through `@app/core/testing`.
// Kept out of `src/index.ts` on purpose: production code must not be able to
// import a fake, and this module is the only place allowed to depend on vitest.

export {
  FailingNameSource,
  InMemoryGreetingSink,
  InMemoryNameSource
} from './in-memory-adapters.ts'
export type {
  GreetingSinkSubject,
  NameSourceSubject
} from './port-contracts.ts'
export { greetingSinkContract, nameSourceContract } from './port-contracts.ts'
