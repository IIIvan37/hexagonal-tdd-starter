import type { NameSource } from '@app/core'

/** Driving adapter: the name comes from a CLI argument. */
export class ArgvNameSource implements NameSource {
  constructor(private readonly name: string) {}

  async load(): Promise<string> {
    return this.name
  }
}
