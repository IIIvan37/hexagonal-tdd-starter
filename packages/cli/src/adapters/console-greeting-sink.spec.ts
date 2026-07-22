// EXAMPLE (greet slice) — DELETE with your first real feature. Removal guide: README "Anatomy".
import { greetingSinkContract } from '@app/core/testing'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConsoleGreetingSink } from './console-greeting-sink.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

// stdout is this adapter's destination, so capturing console.log is what
// "emitted" means for it. The contract itself knows nothing about consoles.
greetingSinkContract('ConsoleGreetingSink', () => {
  const lines: string[] = []
  vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(line)
  })
  return { sink: new ConsoleGreetingSink(), emitted: () => lines }
})

describe('ConsoleGreetingSink — stdout specifics', () => {
  it('writes the message only, not the whole greeting object', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    await new ConsoleGreetingSink().save({
      recipient: 'Ada',
      message: 'Hello, Ada!'
    })

    expect(log).toHaveBeenCalledExactlyOnceWith('Hello, Ada!')
  })
})
