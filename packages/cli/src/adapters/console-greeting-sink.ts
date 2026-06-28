import type { Greeting, GreetingSink } from '@app/core'

/** Driven adapter: the greeting is printed to stdout. */
export class ConsoleGreetingSink implements GreetingSink {
  async save(greeting: Greeting): Promise<void> {
    console.log(greeting.message)
  }
}
