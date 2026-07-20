import type { NameSource } from '@app/core'

/**
 * Driving adapter: the name comes from a CLI argument.
 *
 * Note the explicit field + assignment instead of a TypeScript *parameter
 * property*: the `bin` entry runs the sources through Node's strip-only type
 * stripping, which rejects any syntax that emits code. Same rule for enums,
 * namespaces and decorators anywhere in the adapter graph.
 */
export class ArgvNameSource implements NameSource {
  private readonly name: string

  constructor(name: string) {
    this.name = name
  }

  async load(): Promise<string> {
    return this.name
  }
}
